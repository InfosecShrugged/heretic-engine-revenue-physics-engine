// ─── Netlify Function: HubSpot Adapter ───
// Phase 2: API-based data ingestion from HubSpot CRM
//
// Environment variables required:
//   HUBSPOT_ACCESS_TOKEN — Private app access token (or OAuth token)
//
// Endpoints this function calls:
//   GET /crm/v3/objects/contacts — funnel counts (by lifecycle stage)
//   GET /crm/v3/objects/deals — pipeline by stage, closed-won
//   GET /crm/v3/objects/deals/search — filtered by close date
//   GET /analytics/v2/reports — campaign spend
//
// Deploy: This file goes in /netlify/functions/adapter-hubspot.js
// It deploys automatically when pushed to the connected repo.

export default async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 405 });
  }

  const { action, dateRange, config } = await req.json();
  const token = process.env.HUBSPOT_ACCESS_TOKEN || config?.token;

  if (!token) {
    return new Response(JSON.stringify({ 
      ok: false, message: 'HUBSPOT_ACCESS_TOKEN not configured' 
    }), { status: 401 });
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'test') {
      // Verify connection
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', { headers });
      if (res.ok) {
        return Response.json({ ok: true, message: 'HubSpot connected successfully' });
      }
      return Response.json({ ok: false, message: `HubSpot API returned ${res.status}` });
    }

    if (action === 'sync') {
      // Pull data for the specified date range
      const { startDate, endDate } = dateRange || getDefaultDateRange();

      // 1. Deals closed in period (won + lost)
      const dealsWon = await searchDeals(headers, startDate, endDate, 'closedwon');
      const dealsLost = await searchDeals(headers, startDate, endDate, 'closedlost');

      // 2. Open pipeline (current snapshot)
      const pipeline = await getOpenPipeline(headers);

      // 3. Contacts by lifecycle stage (funnel approximation)
      const funnel = await getLifecycleCounts(headers, startDate, endDate);

      // Normalize to actuals snapshot
      const snapshot = {
        source: 'hubspot',
        timestamp: new Date().toISOString(),
        period: extractPeriod(startDate),
        funnel: {
          inquiries: funnel.subscriber + funnel.lead,
          mqls: funnel.marketingqualifiedlead,
          sqls: funnel.salesqualifiedlead,
          meetingsHeld: null, // HubSpot doesn't track this natively
          sqosCreated: funnel.opportunity,
          dealsWon: dealsWon.count,
          dealsLost: dealsLost.count,
        },
        pipeline: {
          total: { count: pipeline.totalCount, value: pipeline.totalValue },
          // Map HubSpot stages to engine stages (customizable)
          stage1: pipeline.stages['appointmentscheduled'] || { count: 0, value: 0 },
          stage2: pipeline.stages['qualifiedtobuy'] || { count: 0, value: 0 },
          stage3: pipeline.stages['presentationscheduled'] || { count: 0, value: 0 },
          stage4: pipeline.stages['decisionmakerboughtin'] || { count: 0, value: 0 },
          stage5: pipeline.stages['contractsent'] || { count: 0, value: 0 },
        },
        revenue: {
          newLogoARR: dealsWon.totalAmount,
          currentARR: null, // Requires custom property in HubSpot
        },
        capacity: {
          avgDealSize: dealsWon.count > 0 ? dealsWon.totalAmount / dealsWon.count : null,
          winRate: (dealsWon.count + dealsLost.count) > 0
            ? dealsWon.count / (dealsWon.count + dealsLost.count) * 100 : null,
        },
        spend: {},
      };

      return Response.json({ ok: true, snapshot });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }
};

// ─── HubSpot API Helpers ───

async function searchDeals(headers, startDate, endDate, stage) {
  const body = {
    filterGroups: [{
      filters: [
        { propertyName: 'dealstage', operator: 'EQ', value: stage },
        { propertyName: 'closedate', operator: 'GTE', value: startDate },
        { propertyName: 'closedate', operator: 'LTE', value: endDate },
      ]
    }],
    properties: ['dealname', 'amount', 'closedate', 'dealstage'],
    limit: 100,
  };

  const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  const data = await res.json();
  const results = data.results || [];
  
  return {
    count: results.length,
    totalAmount: results.reduce((s, d) => s + (parseFloat(d.properties.amount) || 0), 0),
    deals: results,
  };
}

async function getOpenPipeline(headers) {
  // Get all open deals (not closed-won or closed-lost)
  let allDeals = [];
  let after = undefined;
  
  // Paginate (HubSpot max 100 per page)
  for (let page = 0; page < 10; page++) {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/deals');
    url.searchParams.set('limit', '100');
    url.searchParams.set('properties', 'dealname,amount,dealstage,pipeline');
    if (after) url.searchParams.set('after', after);

    const res = await fetch(url, { headers });
    const data = await res.json();
    allDeals = allDeals.concat(data.results || []);
    
    if (!data.paging?.next?.after) break;
    after = data.paging.next.after;
  }

  // Filter to open deals and group by stage
  const openDeals = allDeals.filter(d => 
    !['closedwon', 'closedlost'].includes(d.properties.dealstage)
  );

  const stages = {};
  let totalCount = 0, totalValue = 0;
  
  openDeals.forEach(d => {
    const stage = d.properties.dealstage;
    const amount = parseFloat(d.properties.amount) || 0;
    if (!stages[stage]) stages[stage] = { count: 0, value: 0 };
    stages[stage].count++;
    stages[stage].value += amount;
    totalCount++;
    totalValue += amount;
  });

  return { stages, totalCount, totalValue };
}

async function getLifecycleCounts(headers, startDate, endDate) {
  // Count contacts by lifecycle stage created in date range
  const stages = ['subscriber', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer'];
  const counts = {};

  for (const stage of stages) {
    const body = {
      filterGroups: [{
        filters: [
          { propertyName: 'lifecyclestage', operator: 'EQ', value: stage },
          { propertyName: 'createdate', operator: 'GTE', value: startDate },
          { propertyName: 'createdate', operator: 'LTE', value: endDate },
        ]
      }],
      limit: 1,
    };

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    const data = await res.json();
    counts[stage] = data.total || 0;
  }

  return counts;
}

function getDefaultDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

function extractPeriod(dateStr) {
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

// Netlify Function config
export const config = {
  path: "/api/adapters/hubspot",
};
