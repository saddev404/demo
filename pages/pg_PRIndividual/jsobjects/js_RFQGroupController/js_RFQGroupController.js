export default {
	sessionState: null,

	prepareGroups(groups = []) {
		return groups.map(g => ({
			groupId: g.groupId,
			groupName: g.groupName,
			lineItems: g.lineItems,
			vendors: g.vendors
		}));
	},

	async generateRFQ() {
		try {
			this.sessionState = 'PROCESSING';
			showAlert("Demo Mode: Generating RFQs...", "info");

			// Mock demo: advance to Stage 4 (RFP Generation)
			await storeValue("demo_native_stage", "rfp_generation");
			await storeValue("viewing_stage_id", "rfp_generation");

			const allGroups = js_MockData.getVendorGroups() || [];
			if (allGroups[0]) {
				await storeValue("selected_vendor_group", allGroups[0]);
			}
			const groupStages = appsmith.store.rfq_group_stages || {};
			if (!groupStages[1]) groupStages[1] = 'rfp_generation';
			if (!groupStages[2]) groupStages[2] = 'rfp_generation';
			await storeValue("rfq_group_stages", groupStages);

			this.sessionState = 'SUCCESS';
			showAlert("Demo Mode: RFQ generated successfully!", "success");
			await js_NavigationController.handleStageSelect("rfp_generation");
		} catch (error) {
			console.error("RFQ Generation Failed", error);
			this.sessionState = 'RETRY_PROMPT';
		}
	},

	async retryRFQ() {
		try {
			this.sessionState = 'PROCESSING';
			showAlert("Demo Mode: Retrying RFQ Generation...", "info");
			this.sessionState = 'SUCCESS';
		} catch (error) {
			this.sessionState = 'FATAL_ERROR';
		}
	},

	clearSessionState() {
		this.sessionState = null;
	}
};