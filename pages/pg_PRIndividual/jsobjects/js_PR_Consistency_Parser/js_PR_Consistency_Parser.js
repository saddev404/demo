export default {
	isAiSummaryVisible: false,
	aiSummaryText: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { background-color: #f8fafc; padding: 16px; color: #1e293b; }
  .summary-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  .header-row { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 16px; }
  .title-group { display: flex; align-items: center; gap: 8px; }
  .sparkle-icon { font-size: 20px; }
  .main-title { font-size: 16px; font-weight: 800; color: #0f172a; }
  .status-badge { background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; border: 1px solid #a7f3d0; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .kpi-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .kpi-value { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }
  .kpi-value.green { color: #10b981; }
  .kpi-value.blue { color: #2563eb; }
  .section-label { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .audit-narrative { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 16px; background: #f0fdf4; border-left: 3px solid #10b981; padding: 10px 14px; border-radius: 0 6px 6px 0; }
  .checklist { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .checklist-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #334155; }
  .check-icon { color: #10b981; font-weight: 800; }
</style>
</head>
<body>
<div class="summary-card">
  <div class="header-row">
    <div class="title-group">
      <span class="sparkle-icon">✨</span>
      <div class="main-title">Multi-Agent AI Executive Summary & Consistency Audit</div>
    </div>
    <span class="status-badge">✓ Audit Passed (8/8 Agents)</span>
  </div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Scope Alignment</div>
      <div class="kpi-value green">100% Validated</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">BOQ Items Verified</div>
      <div class="kpi-value blue">6 of 6 Items</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Delivery Timeline</div>
      <div class="kpi-value">4 Weeks Compliant</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Procurement Risk</div>
      <div class="kpi-value green">LOW / Minimal</div>
    </div>
  </div>
  <div class="section-label">Audit Executive Findings</div>
  <div class="audit-narrative">
    Automated agent validation analyzed technical specifications, commercial proposals, and warranty terms across uploaded PR attachments. All line items, rate benchmarks, and SLA delivery milestones are fully compliant with GMR P2P procurement standards. No discrepancies detected.
  </div>
  <div class="section-label">Key Validations Completed</div>
  <ul class="checklist">
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Technical Compliance:</strong> OEM warranty specifications (36-month DLP) align with engineering requirements.</span></li>
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Pricing & BOQ Consistency:</strong> Calculated unit rates match prevailing Ariba contract rate cards without scope creep.</span></li>
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Vendor Make Validation:</strong> Proposed vendor models match approved corporate IT asset make and model lists.</span></li>
  </ul>
</div>
</body>
</html>`,

	toggleAiSummary: function () {
		this.isAiSummaryVisible = !this.isAiSummaryVisible;
		if (this.isAiSummaryVisible && (!this.aiSummaryText || this.aiSummaryText.includes('[object Object]'))) {
			this.aiSummaryText = this.getAiSummaryHtml();
		}
	},

	getAiSummaryHtml: function () {
		return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  body { background-color: #f8fafc; padding: 16px; color: #1e293b; }
  .summary-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  .header-row { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 16px; }
  .title-group { display: flex; align-items: center; gap: 8px; }
  .sparkle-icon { font-size: 20px; }
  .main-title { font-size: 16px; font-weight: 800; color: #0f172a; }
  .status-badge { background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; border: 1px solid #a7f3d0; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .kpi-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .kpi-value { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }
  .kpi-value.green { color: #10b981; }
  .kpi-value.blue { color: #2563eb; }
  .section-label { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .audit-narrative { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 16px; background: #f0fdf4; border-left: 3px solid #10b981; padding: 10px 14px; border-radius: 0 6px 6px 0; }
  .checklist { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .checklist-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #334155; }
  .check-icon { color: #10b981; font-weight: 800; }
</style>
</head>
<body>
<div class="summary-card">
  <div class="header-row">
    <div class="title-group">
      <span class="sparkle-icon">✨</span>
      <div class="main-title">Multi-Agent AI Executive Summary & Consistency Audit</div>
    </div>
    <span class="status-badge">✓ Audit Passed (8/8 Agents)</span>
  </div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Scope Alignment</div>
      <div class="kpi-value green">100% Validated</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">BOQ Items Verified</div>
      <div class="kpi-value blue">6 of 6 Items</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Delivery Timeline</div>
      <div class="kpi-value">4 Weeks Compliant</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Procurement Risk</div>
      <div class="kpi-value green">LOW / Minimal</div>
    </div>
  </div>
  <div class="section-label">Audit Executive Findings</div>
  <div class="audit-narrative">
    Automated agent validation analyzed technical specifications, commercial proposals, and warranty terms across uploaded PR attachments. All line items, rate benchmarks, and SLA delivery milestones are fully compliant with GMR P2P procurement standards. No discrepancies detected.
  </div>
  <div class="section-label">Key Validations Completed</div>
  <ul class="checklist">
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Technical Compliance:</strong> OEM warranty specifications (36-month DLP) align with engineering requirements.</span></li>
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Pricing & BOQ Consistency:</strong> Calculated unit rates match prevailing Ariba contract rate cards without scope creep.</span></li>
    <li class="checklist-item"><span class="check-icon">✓</span> <span><strong>Vendor Make Validation:</strong> Proposed vendor models match approved corporate IT asset make and model lists.</span></li>
  </ul>
</div>
</body>
</html>`;
	},

	// Safe JSON parser for payload strings
	safeParse: (queryData) => {
		if (!queryData) return null;
		let content = queryData;
		if (Array.isArray(queryData)) {
			if (queryData.length === 0) return null;
			const firstRow = queryData[0];
			if (firstRow && typeof firstRow === 'object') {
				content = firstRow.response_payload || firstRow.Response || firstRow.response || firstRow.payload;
			}
		}
		if (!content) return null;
		if (typeof content === 'object') return content;
		try {
			return JSON.parse(content);
		} catch (e) {
			const match = content.match(/\{[\s\S]*\}/);
			if (match) {
				try { return JSON.parse(match[0]); } catch (err) {}
			}
			return null;
		}
	},

	safeGetRows: (queryResult) => {
		if (!queryResult) return [];
		if (Array.isArray(queryResult)) return queryResult;
		if (queryResult.data && Array.isArray(queryResult.data)) return queryResult.data;
		return [];
	},

	// 1. Resolve Active PR Status and Determine View Mode (ACTIVE vs HISTORICAL)
	getViewMode() {
		const pr = appsmith.store.selected_pr || {};
		const isManual = (typeof js_NavigationController !== 'undefined' && js_NavigationController.isManualRoute)
			? js_NavigationController.isManualRoute()
			: Boolean(
				(pr.STATUS_NAME || pr.statusName || '').toUpperCase().includes('MANUAL') ||
				(pr.statusCode || pr.STATUS_CODE || '').toUpperCase().includes('MANUAL')
			);
		if (isManual) {
			return 'HISTORICAL';
		}
		const nativeStatus = js_NavigationController.getNativeStageId();

		if (nativeStatus === 'consistency_check') {
			if (appsmith.store.selected_pr.statusCode === 'PR_REJECTED') {
				return 'HISTORICAL';
			}
			return 'ACTIVE';
		}

		if (appsmith.store.selected_pr.statusCode === 'PR_REJECTED') {
			return 'HISTORICAL';
		}

		return 'HISTORICAL';
	},

	// 2. Main Parser Function
	getCleanConsistencyData: function() {
		const attachments = js_MockData.getAttachments();
		const consistencyList = js_MockData.getConsistencyData();

		const agentRows = {};
		consistencyList.forEach(row => {
			if (row && row.agent_name) {
				agentRows[row.agent_name.toUpperCase()] = row;
			}
		});

		const findAgentRow = (keys) => {
			const keyList = Array.isArray(keys) ? keys : [keys];
			for (const k of keyList) {
				const u = k.toUpperCase();
				if (agentRows[u]) return agentRows[u];
			}
			const rowKey = Object.keys(agentRows).find(rk =>
				keyList.some(k => rk.includes(k.toUpperCase()) || k.toUpperCase().includes(rk))
			);
			return rowKey ? agentRows[rowKey] : null;
		};

		const agentStatuses = {
			classifier: findAgentRow(['FILE_CLASSIFICATION'])?.agent_status || 'PENDING',
			scope: findAgentRow(['SCOPE_VALIDATION'])?.agent_status || 'PENDING',
			timeline: findAgentRow(['TIMELINE_VALIDATION'])?.agent_status || 'PENDING',
			boq: findAgentRow(['BOQ_VALIDATION'])?.agent_status || 'PENDING',
			techSpecs: findAgentRow(['TECH_SPEC_VALIDATION'])?.agent_status || 'PENDING',
			assetList: findAgentRow(['ASSET_LIST_VALIDATION'])?.agent_status || 'PENDING',
			vendorMake: findAgentRow(['VENDOR_MAKE_VALIDATION'])?.agent_status || 'PENDING',
			enfaCheck: findAgentRow(['ENFA_CHECK_VALIDATION'])?.agent_status || 'PENDING'
		};

		const REQUIRED_AGENTS = ['classifier', 'scope', 'timeline', 'boq', 'techSpecs', 'assetList', 'vendorMake', 'enfaCheck'];
		const allAgentsCompleted = REQUIRED_AGENTS.every(agentKey => {
			const status = String(agentStatuses[agentKey] || '').toUpperCase();
			return status === 'AGENT_PROCESS_COMPLETED' || status === 'COMPLETED' || status === 'SUCCESS';
		});

		const hasConsistencyData = consistencyList.length > 0 || Object.keys(agentRows).length > 0;

		let flowStatus = "READY";
		let statusMessage = "Multi-agent consistency verification complete.";

		if (attachments.length === 0 && !hasConsistencyData) {
			flowStatus = "NO_ATTACHMENTS";
			statusMessage = "No PR Attachment data found";
		} else {
			flowStatus = "READY";
		}

		const getPayload = (agentKeys) => {
			const row = findAgentRow(agentKeys);
			if (row && row.response_payload) {
				return this.safeParse(row.response_payload);
			}
			return null;
		};

		const pr = appsmith.store.selected_pr || {};
		const isManual = (typeof js_NavigationController !== 'undefined' && js_NavigationController.isManualRoute)
			? js_NavigationController.isManualRoute()
			: Boolean(
				(pr.STATUS_NAME || pr.statusName || '').toUpperCase().includes('MANUAL') ||
				(pr.statusCode || pr.STATUS_CODE || '').toUpperCase().includes('MANUAL')
			);

		return {
			currentStageId: js_NavigationController.getNativeStageId(),
			consistencyData: {
				viewMode: this.getViewMode(),
				isManualRoute: isManual,
				statusName: appsmith.store.selected_pr?.STATUS_NAME || appsmith.store.selected_pr?.statusName || '',
				flowStatus: flowStatus,
				statusMessage: statusMessage,
				allAgentsCompleted: allAgentsCompleted,
				agentStatuses: agentStatuses,
				classifier: getPayload(['FILE_CLASSIFICATION']),
				scope: getPayload(['SCOPE_VALIDATION']),
				timeline: getPayload(['TIMELINE_VALIDATION']),
				boq: getPayload(['BOQ_VALIDATION']),
				techSpecs: getPayload(['TECH_SPEC_VALIDATION']),
				assetList: getPayload(['ASSET_LIST_VALIDATION']),
				vendorMake: getPayload(['VENDOR_MAKE_VALIDATION']),
				enfaCheck: getPayload(['ENFA_CHECK_VALIDATION'])
			}
		};
	}
};