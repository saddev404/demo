export default {
	async handleGroupSelect(groupId) {
		const allGroups = js_MockData.getVendorGroups() || [];
		if (allGroups.length === 0) return;

		const targetGroupId = groupId || (typeof RFP_VendorGroupSelector !== 'undefined' && RFP_VendorGroupSelector.model ? RFP_VendorGroupSelector.model.selectedGroupId : null) || allGroups[0].RFQ_GROUP_ID;
		const selectedGroup = allGroups.find(g => Number(g.RFQ_GROUP_ID) === Number(targetGroupId)) || allGroups[0];

		if (selectedGroup) {
			let parsedJson = {};
			try {
				if (selectedGroup.RFQ_DATA_JSON) {
					parsedJson = typeof selectedGroup.RFQ_DATA_JSON === 'string'
						? JSON.parse(selectedGroup.RFQ_DATA_JSON)
					: selectedGroup.RFQ_DATA_JSON;
				}
			} catch (e) {
				showAlert("Failed to parse RFQ_DATA_JSON: " + (e.message || e), "error");
			}

			// Get the tracked stage and status for this specific group
			const groupStages = appsmith.store.rfq_group_stages || {};
			const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
			const grpStage = groupStages[selectedGroup.RFQ_GROUP_ID] || 'rfp_generation';
			const activeR = selectedGroup.activeRound || 1;

			await storeValue("selected_vendor_group", {
				...selectedGroup,
				parsedRfqData: parsedJson,
				currentStageId: grpStage
			});
			await storeValue("active_sourcing_round", activeR);
			await storeValue("viewing_sourcing_round", activeR);

			if (typeof js_NFAController !== 'undefined' && js_NFAController.syncGroupState) {
				await js_NFAController.syncGroupState(selectedGroup.RFQ_GROUP_ID);
			}

			// Auto-guard: If user is viewing a stage beyond what this newly selected group has reached:
			// Reset viewing stage to the group's highest unlocked stage
			const currentViewingIdx = stageOrder.indexOf(appsmith.store.viewing_stage_id);
			const targetGrpIdx = stageOrder.indexOf(grpStage);
			if (currentViewingIdx > targetGrpIdx && targetGrpIdx >= 0) {
				await storeValue('viewing_stage_id', grpStage);
				await js_NavigationController.handleStageSelect(grpStage);
			}
		}
	},

	isProceedDisabled() {
		const grp = appsmith.store.selected_vendor_group;
		if (!grp) return true;
		const grpId = grp.RFQ_GROUP_ID || 1;
		const groupStages = appsmith.store.rfq_group_stages || {};
		const stage = groupStages[grpId] || (grp.STATUS === 'SEND_RFP' ? 'send_rfp' : 'rfp_generation');

		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const rfpGenIdx = stageOrder.indexOf('rfp_generation');

		// 1. If already advanced past RFP Generation (send_rfp, bid_monitoring, etc.): Lock / disable button
		if (stageIdx > rfpGenIdx || ['SEND_RFP', 'BID_MONITORING'].includes(grp.STATUS)) {
			return true;
		}

		// 2. If template has not been generated yet: Lock / disable button
		if (grp.STATUS !== 'TEMPLATE_GENERATED') {
			return true;
		}

		// 3. Unlocked: Ready to proceed!
		return false;
	},

	getProceedButtonText() {
		const grp = appsmith.store.selected_vendor_group;
		if (!grp) return 'Proceed to Send RFP →';
		const grpId = grp.RFQ_GROUP_ID || 1;
		const groupStages = appsmith.store.rfq_group_stages || {};
		const stage = groupStages[grpId] || (grp.STATUS === 'SEND_RFP' ? 'send_rfp' : 'rfp_generation');

		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const rfpGenIdx = stageOrder.indexOf('rfp_generation');

		if (stageIdx > rfpGenIdx || ['SEND_RFP', 'BID_MONITORING'].includes(grp.STATUS)) {
			return 'Already Advanced';
		}
		if (grp.STATUS !== 'TEMPLATE_GENERATED') {
			return 'Submit Template First';
		}
		return 'Proceed to Send RFP →';
	},

	isRegenerateDisabled() {
		const grp = appsmith.store.selected_vendor_group;
		if (!grp) return true;
		const grpId = grp.RFQ_GROUP_ID || 1;
		const groupStages = appsmith.store.rfq_group_stages || {};
		const stage = groupStages[grpId] || (grp.STATUS === 'SEND_RFP' ? 'send_rfp' : 'rfp_generation');

		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const rfpGenIdx = stageOrder.indexOf('rfp_generation');

		// 1. If already advanced past RFP Generation: Lock / disable regenerate button
		if (stageIdx > rfpGenIdx || ['SEND_RFP', 'BID_MONITORING'].includes(grp.STATUS)) {
			return true;
		}

		// 2. Disable while actively submitting/generating
		if (['SUBMITTED_TEMPLATE_GENERATION', 'TEMPLATE_GENERATING'].includes(grp.STATUS)) {
			return true;
		}

		// 3. Only enabled when template has been generated and is ready for revision
		if (grp.STATUS !== 'TEMPLATE_GENERATED') {
			return true;
		}

		return false;
	},

	async saveDraft() {
		const currentGroup = appsmith.store.selected_vendor_group;
		if (!currentGroup) return;

		try {
			closeModal('mdl_RfqTemplateSubmit');
			showAlert("Demo Mode: Draft saved successfully!", "success");

			currentGroup.STATUS = 'BUYER_REVIEW';
			await storeValue("selected_vendor_group", currentGroup);
		} catch (error) {
			showAlert(`Failed to save draft: ${error.message || error}`, "error");
		}
	},

	async submitForTemplate() {
		const currentGroup = appsmith.store.selected_vendor_group;
		if (!currentGroup) return;

		try {
			closeModal('mdl_RfqTemplateSubmit');
			showAlert(`Demo Mode: Template Generated for ${currentGroup.GROUP_NAME}! Proceed to Send RFP unlocked.`, "success");

			currentGroup.STATUS = "TEMPLATE_GENERATED";
			await storeValue("selected_vendor_group", currentGroup);
		} catch (error) {
			showAlert(`Your request failed. Details: ${error.message || error}`, "error");
		}
	},

	async regenerateTemplate() {
		const currentGroup = appsmith.store.selected_vendor_group;
		if (!currentGroup) return;

		try {
			showAlert("Demo Mode: Regenerate Triggered - Form Unlocked", "info");
			currentGroup.STATUS = "BUYER_REVIEW";
			await storeValue("selected_vendor_group", currentGroup);
		} catch (error) {
			showAlert(`Failed to switch to regenerate mode: ${error.message || error}`, "error");
		}
	},

	async proceedToSendRfp() {
		const allGroups = js_MockData.getVendorGroups() || [];
		const currentGroup = appsmith.store.selected_vendor_group || allGroups[0] || {};
		const grpId = currentGroup.RFQ_GROUP_ID || 1;

		if (currentGroup.STATUS !== 'TEMPLATE_GENERATED') {
			showAlert('Please submit and generate the RFQ template before proceeding.', 'warning');
			return;
		}

		// 1. Advance THIS specific RFQ group to Stage 5
		const groupStages = appsmith.store.rfq_group_stages || {};
		groupStages[grpId] = 'send_rfp';
		await storeValue("rfq_group_stages", groupStages);

		// 2. Keep status as TEMPLATE_GENERATED so template preview remains visible
		currentGroup.STATUS = "TEMPLATE_GENERATED";
		currentGroup.currentStageId = 'send_rfp';
		await storeValue("selected_vendor_group", currentGroup);

		// 3. Sourcing round hydration
		const activeR = currentGroup.activeRound || 1;
		await storeValue("active_sourcing_round", activeR);
		await storeValue("viewing_sourcing_round", activeR);

		// 4. Simulation step initialization
		const simKey = Number(grpId) === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		if (!appsmith.store[simKey]) {
			await storeValue(simKey, 1);
		}

		// 5. Navigate to Stage 5
		await storeValue("viewing_stage_id", "send_rfp");
		showAlert(`Advanced ${currentGroup.GROUP_NAME} to Stage 05 (Send RFP)!`, "success");
		await js_NavigationController.handleStageSelect("send_rfp");
	}
};