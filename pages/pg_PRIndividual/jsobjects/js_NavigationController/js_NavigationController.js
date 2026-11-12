export default {
	// ============================================================================
	// MASTER STAGE DEFINITION (01 to 10)
	// ============================================================================
	STAGES: [
		{ id: 'oa_arc_check', number: '01', title: 'OA / ARC Check', implemented: true },
		{ id: 'consistency_check', number: '02', title: 'Consistency Check', implemented: true },
		{ id: 'vendor_recommendation', number: '03', title: 'Vendor Selection', implemented: true },
		{ id: 'rfp_generation', number: '04', title: 'RFP Generation', implemented: true },
		{ id: 'send_rfp', number: '05', title: 'Send RFP', implemented: true },
		{ id: 'bid_monitoring', number: '06', title: 'Bid Monitoring', implemented: true },
		{ id: 'technical_evaluation', number: '07', title: 'Technical Evaluation', implemented: true },
		{ id: 'commercial', number: '08', title: 'Commercial', implemented: true },
		{ id: 'negotiation', number: '09', title: 'Negotiation', implemented: true },
		{ id: 'enfa', number: '10', title: 'ENFA', implemented: true }
	],

	STATUS_MAP: {
		'pr_rejected': 'consistency_check',
		'oaarc_check': 'oa_arc_check',
		'pr_consistency_check': 'consistency_check',
		'alloc_done': 'consistency_check',
		'pr_consistency_approved': 'vendor_recommendation',
		'vendor_recommendation': 'vendor_recommendation',
		'vendor_selection': 'rfp_generation',
		'rfp_generation': 'rfp_generation',
		'send_rfp': 'send_rfp',
		'rfp_published': 'send_rfp',
		'bid_monitoring': 'bid_monitoring',
		'technical_evaluation': 'technical_evaluation',
		'commercial': 'commercial',
		'negotiation': 'negotiation',
		'enfa': 'enfa',
		'e_nfa': 'enfa',
		'nfa_ariba': 'enfa'
	},

	// ============================================================================
	// STORE HYDRATION (PURE MOCK DEMO - ZERO DB QUERIES)
	// ============================================================================
	getSelectedPR() {
		return appsmith.store.selected_pr || {};
	},

	_parseNumeric(value) {
		if (value === null || value === undefined) return 0;
		if (typeof value === "number") return isNaN(value) ? 0 : value;
		const cleaned = String(value).replace(/[^\d.-]/g, "");
		const parsed = parseFloat(cleaned);
		return isNaN(parsed) ? 0 : parsed;
	},

	_standardizePR(row = {}) {
		return {
			...row,
			prId: row.PR_ID || row.prId || "6000062364",
			requisition: row.REQUISITION_NUMBER || row.requisition || "PR20260041",
			value: this._parseNumeric(row.REQUISITION_VALUE || row.value || 237594.34),
			statusCode: row.STATUS_CODE || row.statusCode || "PR_CONSISTENCY_CHECK",
			statusName: row.STATUS_NAME || row.statusName || "Consistency Check",
			category: row.CATEGORY || row.category || "SERVICES",
			createdDate: row.CREATED_DATE || row.createdDate || "04 Aug 2026",
			oaCount: row.OA_COUNT || row.oaCount || 0,
			arcCount: row.ARC_COUNT || row.arcCount || 0,
			plantNameCode: (row.PLANT_NAME || "GMR GOA INTERNATIONAL AIRPORT") + " (" + (row.PLANT_CODE || "1800") + ")"
		};
	},

	async initializeWorkflow() {
		const pr = this.getSelectedPR();
		if (!pr || (!pr.prId && !pr.PR_ID)) {
			showAlert("No active PR found.", "error");
			return false;
		}
		try {
			const standardized = this._standardizePR(pr);
			await storeValue("selected_pr", standardized);

			const activePrId = appsmith.store.active_pr_id;
			const isNewPR = !activePrId || String(activePrId) !== String(standardized.prId);

			if (isNewPR) {
				await storeValue("active_pr_id", standardized.prId);
				const rawStatus = (standardized.statusCode || "").toLowerCase().trim();
				const rawStatusName = (standardized.statusName || standardized.STATUS_NAME || "").toLowerCase().trim();
				const isManual = rawStatus.includes('manual') || rawStatusName.includes('manual');
				await storeValue("is_manual_route", isManual);
				const initialStage = this.STATUS_MAP[rawStatus] || "consistency_check";
				await storeValue("demo_native_stage", initialStage);
				await storeValue("viewing_stage_id", initialStage);
				await storeValue("selected_vendor_group", null);
				await storeValue("rfq_group_stages", {});
				await storeValue("viewing_sourcing_round", 1);
			} else {
				let curStage = appsmith.store.demo_native_stage;
				if (!curStage) {
					const rawStatus = (standardized.statusCode || "").toLowerCase().trim();
					curStage = this.STATUS_MAP[rawStatus] || "consistency_check";
					await storeValue("demo_native_stage", curStage);
				}
				const stageId = this.getViewingStageId();
				await storeValue('viewing_stage_id', stageId);
			}

			return true;
		} catch (error) {
			showAlert(`Unable to initialise PR workflow: ${error?.message || error}`, 'error');
			return false;
		}
	},

	// ============================================================================
	// STAGE DERIVATION (DYNAMIC PER-RFQ-GROUP CALCULATION)
	// ============================================================================
		isManualRoute() {
		const pr = this.getSelectedPR();
		const code = String(pr.STATUS_CODE || pr.statusCode || '').toUpperCase();
		const name = String(pr.STATUS_NAME || pr.statusName || '').toUpperCase();
		if (code.includes('MANUAL') || name.includes('MANUAL')) {
			return true;
		}
		const prId = String(pr.prId || pr.PR_ID || pr.requisition || pr.REQUISITION_NUMBER || "");
		const manualPrId = String(appsmith.store.manual_route_pr_id || "");
		return Boolean(appsmith.store.is_manual_route && prId && manualPrId && prId === manualPrId);
	},

	getNativeStageId() {
		const pr = this.getSelectedPR();
		const rawStatus = (pr.statusCode || pr.STATUS_CODE || "").toLowerCase().trim();
		const prId = String(pr.prId || pr.PR_ID || pr.requisition || pr.REQUISITION_NUMBER || "");
		const storedPrId = String(appsmith.store.active_pr_id || "");

		let baseStage;
		if (prId && storedPrId && prId === storedPrId && appsmith.store.demo_native_stage) {
			baseStage = appsmith.store.demo_native_stage;
		} else {
			baseStage = this.STATUS_MAP[rawStatus] || 'consistency_check';
		}

		const baseIndex = this.STAGES.findIndex(s => s.id === baseStage);
		const rfpGenIndex = this.STAGES.findIndex(s => s.id === 'rfp_generation'); // index 3

		// Stages 01 to 03 are PR-level stages:
		if (baseIndex < rfpGenIndex) {
			return baseStage;
		}

		// ENFA can be entered directly at PR level (for example NFA in Ariba).
		// Keep this above RFQ-group stage derivation so the direct ENFA route is preserved.
		if (baseStage === 'enfa') {
			return 'enfa';
		}

		// Stage 04 onwards: RFQ Group specific
		const selectedGroup = appsmith.store.selected_vendor_group;
		if (selectedGroup && selectedGroup.RFQ_GROUP_ID) {
			const grpId = selectedGroup.RFQ_GROUP_ID;
			const groupStages = appsmith.store.rfq_group_stages || {};
			const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
			const activeRound = storeActiveRounds[grpId] || appsmith.store.active_sourcing_round || selectedGroup.activeRound || 1;
			const viewingRound = Number(appsmith.store.viewing_sourcing_round || activeRound);

			// If viewing an older completed round, stages up to commercial are unlocked for audit review
			if (viewingRound < activeRound) {
				return 'commercial';
			}

			if (groupStages[grpId]) {
				return groupStages[grpId];
			}
			if (selectedGroup.STATUS === 'SEND_RFP') {
				return 'send_rfp';
			}
			return 'rfp_generation';
		}

		return baseStage;
	},

	getViewingStageId() {
		const nativeStageId = this.getNativeStageId();
		const requested = appsmith.store.viewing_stage_id;

		if (requested) {
			const reqStage = this.STAGES.find(s => s.id === requested);
			if (reqStage && reqStage.implemented) {
				const nativeIndex = this.STAGES.findIndex(s => s.id === nativeStageId);
				const reqIndex = this.STAGES.findIndex(s => s.id === requested);

				// Only allow viewing stages up to the native unlocked stage
				if (reqIndex <= nativeIndex) {
					return requested;
				}
			}
		}

		return nativeStageId;
	},

	getDefaultTabName() {
		const stageId = this.getViewingStageId();
		const stage = this.STAGES.find(s => s.id === stageId);
		return stage ? stage.title : 'Consistency Check';
	},

	// ============================================================================
	// EVENT HANDLERS (PURE MOCK DEMO - ZERO DB QUERIES)
	// ============================================================================
	loadStageData(stageId) {
		return Promise.resolve();
	},

	async handleConsistencyAccept() {
		try {
			const curPR = this.getSelectedPR();
			const prId = String(curPR.prId || curPR.PR_ID || curPR.requisition || curPR.REQUISITION_NUMBER || '');

			await storeValue("is_manual_route", false);
			await storeValue("manual_route_pr_id", null);
			await storeValue("active_pr_id", prId);
			await storeValue("demo_native_stage", "vendor_recommendation");
			await storeValue("viewing_stage_id", "vendor_recommendation");

			curPR.STATUS_NAME = "Vendor Selection";
			curPR.statusName = "Vendor Selection";
			curPR.STATUS_CODE = "VENDOR_SELECTION";
			curPR.statusCode = "VENDOR_SELECTION";
			await storeValue("selected_pr", curPR);

			const overrides = appsmith.store.pr_overrides || {};
			overrides[prId] = {
				STATUS_NAME: "Vendor Selection",
				statusName: "Vendor Selection",
				STATUS_CODE: "VENDOR_SELECTION",
				statusCode: "VENDOR_SELECTION"
			};
			await storeValue("pr_overrides", overrides);

			showAlert('Demo Mode: PR Consistency Accepted!', 'success');
			await this.handleStageSelect("vendor_recommendation");
		} catch (error) {
			showAlert(`Failed: ${error?.message || error}`, 'error');
		}
	},

	async handleConsistencyReject(rejectionComment) {
		if (!rejectionComment || rejectionComment.trim() === '') {
			showAlert('Rejection comment is required.', 'error');
			return false;
		}
		showAlert('Demo Mode: PR Rejected!', 'warning');
		return true;
	},

	async handleAcceptRoute(selectedRoute) {
		closeModal('mdl_AcceptPROptions');
		if (!selectedRoute) selectedRoute = 'RFP_ARIBA';

		if (selectedRoute === 'RFP_ARIBA' || selectedRoute === 'DIRECT_PO') {
			await storeValue("is_manual_route", false);
			await this.handleConsistencyAccept();
		} else if (selectedRoute === 'NFA_ARIBA') {
			const curPR = this.getSelectedPR();
			const prId = String(curPR.prId || curPR.PR_ID || curPR.requisition || curPR.REQUISITION_NUMBER || '');

			await storeValue("is_manual_route", false);
			await storeValue("manual_route_pr_id", null);
			await storeValue("active_pr_id", prId);
			await storeValue("demo_native_stage", "enfa");
			await storeValue("viewing_stage_id", "enfa");

			curPR.STATUS_NAME = "e-NFA";
			curPR.statusName = "e-NFA";
			curPR.STATUS_CODE = "E_NFA";
			curPR.statusCode = "E_NFA";
			await storeValue("selected_pr", curPR);

			const overrides = appsmith.store.pr_overrides || {};
			overrides[prId] = {
				STATUS_NAME: "e-NFA",
				statusName: "e-NFA",
				STATUS_CODE: "E_NFA",
				statusCode: "E_NFA"
			};
			await storeValue("pr_overrides", overrides);

			showAlert('PR Consistency Accepted! Routed directly to ENFA (Stage 10).', 'success');
			await this.handleStageSelect("enfa");
		} else if (selectedRoute === 'MANUAL_ROUTE') {
			const curPR = this.getSelectedPR();
			const prId = String(curPR.prId || curPR.PR_ID || curPR.requisition || curPR.REQUISITION_NUMBER || '');

			await storeValue("is_manual_route", true);
			await storeValue("manual_route_pr_id", prId);
			await storeValue("active_pr_id", prId);
			await storeValue("demo_native_stage", "consistency_check");
			await storeValue("viewing_stage_id", "consistency_check");

			curPR.STATUS_NAME = "Manual Route";
			curPR.statusName = "Manual Route";
			curPR.STATUS_CODE = "MANUAL_ROUTE";
			curPR.statusCode = "MANUAL_ROUTE";
			await storeValue("selected_pr", curPR);

			const overrides = appsmith.store.pr_overrides || {};
			overrides[prId] = {
				STATUS_NAME: "Manual Route",
				statusName: "Manual Route",
				STATUS_CODE: "MANUAL_ROUTE",
				statusCode: "MANUAL_ROUTE"
			};
			await storeValue("pr_overrides", overrides);

			showAlert('PR Accepted and routed to Manual Route. Forward workflow stages locked.', 'info');
		}
	},

	async handleStageSelect(targetStageId) {
		if (this.isManualRoute() && targetStageId !== 'consistency_check' && targetStageId !== 'oa_arc_check') {
			showAlert('This PR is routed manually. Forward workflow stages are disabled.', 'warning');
			return false;
		}
		if (typeof targetStageId !== 'string' || !targetStageId.trim()) {
			showAlert('Navigation Alert: please wait, dont spam', 'info');
			return false;
		}

		const stageDef = this.STAGES.find(s => s.id === targetStageId);
		if (!stageDef || !stageDef.implemented) {
			showAlert(`Stage not implemented: ${targetStageId}`, 'warning');
			return false;
		}

		const nativeStageId = this.getNativeStageId();
		const nativeIndex = this.STAGES.findIndex(s => s.id === nativeStageId);
		const reqIndex    = this.STAGES.findIndex(s => s.id === targetStageId);
		if (reqIndex > nativeIndex) {
			const selectedGroup = appsmith.store.selected_vendor_group || {};
			if (nativeIndex >= 3 && selectedGroup.GROUP_NAME) {
				showAlert(`Stage is locked for ${selectedGroup.GROUP_NAME}. Complete current stage first.`, 'warning');
			} else {
				showAlert('This workflow stage is still locked.', 'warning');
			}
			return false;
		}

		await storeValue('viewing_stage_id', targetStageId);
		if (targetStageId === 'negotiation') {
			const selectedGroup = appsmith.store.selected_vendor_group || {};
			const grpId = String(selectedGroup.RFQ_GROUP_ID || selectedGroup.groupId || selectedGroup.GROUP_ID || 'default');
			const groupPages = appsmith.store.negotiation_group_pages || {};
			const page = groupPages[grpId] || 'negotiation_landing';
			await storeValue('negotiation_inner_page', page, true);
		}
		if (targetStageId === 'enfa') {
			if (typeof js_NFAController !== 'undefined' && js_NFAController.syncGroupState) {
				await js_NFAController.syncGroupState();
			} else if (typeof js_NFAController !== 'undefined' && js_NFAController.prepare) {
				await js_NFAController.prepare(false);
			}
		}
		return true;
	},

	// ============================================================================
	// RIBBON MODEL PROVIDER (DYNAMICALLY DERIVED FROM ACTIVE RFQ GROUP)
	// ============================================================================
	formatCurrency(val) {
		if (val === undefined || val === null || val === '') return '';
		const num = Number(val);
		return isNaN(num) ? String(val) : '₹ ' + num.toLocaleString('en-IN');
	},

	getRibbonModel(selectedGroupParam, viewingRoundParam, rfqGroupStagesParam, viewingStageParam, demoNativeStageParam) {
		const pr = this.getSelectedPR();

		// Single Source of Truth: derive directly from unified stage methods
		const nativeStageId = this.getNativeStageId();
		const viewingStageId = this.getViewingStageId();
		const nativeIndex = this.STAGES.findIndex(s => s.id === nativeStageId);

		const selectedGroup = selectedGroupParam || appsmith.store.selected_vendor_group || {};
		const allGroups = js_MockData.getVendorGroups() || [];
		const activeGroupId = selectedGroup.RFQ_GROUP_ID || 1;
		const matchedGroup = allGroups.find(g => Number(g.RFQ_GROUP_ID) === Number(activeGroupId)) || allGroups[0] || {};

		let prPrefix = '', prNumber = '';
		if (pr.requisition || pr.sap_pr_number) {
			const reqStr = String(pr.requisition || pr.sap_pr_number);
			const parts = reqStr.split('-');
			if (parts.length >= 3) {
				prPrefix = `${parts[0]}-${parts[1]}`;
				prNumber = parts.slice(2).join('-');
			} else prNumber = reqStr;
		}

		const rawLineItems = js_MockData.getLineItems() || [];
		const lineItems = rawLineItems.map((item, idx) => ({
			...item,
			lineId: item.line_id || item.LINE_ID || (idx + 1),
			itemName: item.short_text || item.SHORT_TEXT || '—',
			quantity: item.quantity !== undefined ? item.quantity : (item.QUANTITY || 0)
		}));

		const buyerName = pr.buyerName || (appsmith.store.active_buyer ? appsmith.store.active_buyer.name : 'Aarav Sharma');

		const attachmentData = js_MockData.getAttachments() || [];
		const attachments = attachmentData.map(att => ({
			fileName: att.file_name || 'Unknown Document',
			sourceUrl: att.source_url || ''
		}));

		const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
		const activeRound = storeActiveRounds[activeGroupId] || appsmith.store.active_sourcing_round || matchedGroup.activeRound || 1;
		const storeViewingRound = viewingRoundParam || appsmith.store.viewing_sourcing_round;
		const viewingRound = storeViewingRound ? Number(storeViewingRound) : activeRound;

		const numRounds = Math.max(activeRound, (matchedGroup.rounds || []).length || 1);
		const rounds = [];
		for (let i = 1; i <= Math.min(4, numRounds); i++) {
			const existing = (matchedGroup.rounds || []).find(r => r.number === i);
			rounds.push({
				number: i,
				label: 'RFP ' + i,
				description: existing ? (existing.description || ('RFP ' + i)) : ('RFP ' + i)
			});
		}

		// PR-Level vs RFQ Group-Level summary
		// Stage 09 (ENFA) operates at the overall PR level and does NOT use sourcing rounds
		const isEnfaStage = viewingStageId === 'enfa';
		const isRfqStage = nativeIndex >= 3 && !isEnfaStage;
		const bannerTitle = isRfqStage ? (matchedGroup.GROUP_NAME || pr.category || 'SERVICES') : (pr.category || 'SERVICES');
		const bannerBudget = isRfqStage
		? this.formatCurrency(matchedGroup.RFQ_DATA_JSON ? (matchedGroup.RFQ_DATA_JSON.line_amount || matchedGroup.RFQ_DATA_JSON['PR Value']) : (pr.value || 237594.34))
		: this.formatCurrency(pr.value || 237594.34);
		const totalItemsCount = (isRfqStage && matchedGroup.RFQ_DATA_JSON && matchedGroup.RFQ_DATA_JSON.BOQ)
		? matchedGroup.RFQ_DATA_JSON.BOQ.length
		: lineItems.length;

		return {
			stages: this.STAGES,
			currentStageId: nativeStageId,
			viewingStageId: viewingStageId,

			sourcingRoundInfo: isEnfaStage ? {
				activeRound: null,
				viewingRound: null,
				rounds: []
			} : {
				activeRound: activeRound,
				viewingRound: viewingRound,
				rounds: rounds.length > 0 ? rounds : [{ number: 1, label: 'RFP 1', description: 'RFP 1' }]
			},

			prSummary: {
				prNumber: prNumber || 'PR20260041',
				prPrefix: prPrefix || 'PR',
				title: bannerTitle,
				requestor: buyerName,
				buyerName: buyerName,
				budget: bannerBudget,
				creationDate: pr.createdDate || '04 Aug 2026',
				totalItems: totalItemsCount
			},

			tableColumns: [
				{ key: 'lineId', label: 'Line ID' },
				{ key: 'itemName', label: 'Item Description' },
				{ key: 'material_code', label: 'Material No' },
				{ key: 'unit_price', label: 'Unit Price' },
				{ key: 'uom', label: 'Unit of Measure' },
				{ key: 'quantity', label: 'Quantity' }
			],
			tableData: lineItems,
			attachments: attachments
		};
	},

	async handleRoundSelect(roundNum) {
		const r = Number(roundNum) || 1;
		await storeValue('viewing_sourcing_round', r);

		const selectedGroup = appsmith.store.selected_vendor_group || {};
		const activeGroupId = selectedGroup.RFQ_GROUP_ID || 1;
		const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
		const activeRound = storeActiveRounds[activeGroupId] || appsmith.store.active_sourcing_round || 1;

		if (r < activeRound) {
			const cur = appsmith.store.viewing_stage_id;
			const rfqStages = ['send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation'];
			if (!rfqStages.includes(cur)) {
				await storeValue('viewing_stage_id', 'commercial');
			}
		} else {
			const groupStages = appsmith.store.rfq_group_stages || {};
			const activeStage = groupStages[activeGroupId] || 'send_rfp';
			const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
			const curIdx = stageOrder.indexOf(appsmith.store.viewing_stage_id);
			const actIdx = stageOrder.indexOf(activeStage);
			if (curIdx > actIdx) {
				await storeValue('viewing_stage_id', activeStage);
			}
		}
	},

	async returnToActiveRound() {
		const selectedGroup = appsmith.store.selected_vendor_group || {};
		const activeGroupId = selectedGroup.RFQ_GROUP_ID || 1;
		const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
		const activeRound = storeActiveRounds[activeGroupId] || appsmith.store.active_sourcing_round || 1;
		await storeValue('viewing_sourcing_round', activeRound);
	}
};