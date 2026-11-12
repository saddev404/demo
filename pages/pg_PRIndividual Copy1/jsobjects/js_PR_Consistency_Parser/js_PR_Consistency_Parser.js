export default {
	isAiSummaryVisible: false,
	aiSummaryText: "",

	toggleAiSummary: function () {
		this.isAiSummaryVisible = !this.isAiSummaryVisible;

		// Load data only when opening and if not already loaded
		if (this.isAiSummaryVisible && !this.aiSummaryText) {
			const data = js_MockData.getConsistencyData() || [];
			const summaryRow = data.find(r => r.agent_name && r.agent_name.toUpperCase() === 'PR_SUMMARIZATION');
			if (summaryRow && summaryRow.response_payload) {
				try {
					let b64 = summaryRow.response_payload.replace(/-/g, '+').replace(/_/g, '/');
					while (b64.length % 4) b64 += '=';
					this.aiSummaryText = decodeURIComponent(escape(atob(b64)));
				} catch (e) {
					this.aiSummaryText = "AI Summary data is not available.";
				}
			} else {
				this.aiSummaryText = "No AI Summary available.";
			}
		}
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

		return {
			currentStageId: js_NavigationController.getNativeStageId(),
			consistencyData: {
				viewMode: this.getViewMode(),
				flowStatus: flowStatus,
				statusMessage: statusMessage,
				allAgentsCompleted: allAgentsCompleted, // Controls Footer Action Bar!
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