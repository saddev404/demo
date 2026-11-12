export default {
	// ============================================================================
	// ACTIVE RFQ GROUP RESOLUTION
	// ============================================================================
	getSelectedGroup() {
		const storeGroup = appsmith.store.selected_vendor_group;
		if (storeGroup && storeGroup.RFQ_GROUP_ID) {
			const allGroups = (typeof js_MockData !== 'undefined' && js_MockData.getVendorGroups) ? js_MockData.getVendorGroups() : [];
			const matched = allGroups.find(g => Number(g.RFQ_GROUP_ID) === Number(storeGroup.RFQ_GROUP_ID));
			return matched || storeGroup;
		}
		const allGroups = (typeof js_MockData !== 'undefined' && js_MockData.getVendorGroups) ? js_MockData.getVendorGroups() : [];
		return allGroups[0] || {};
	},

	getSelectedGroupId() {
		return this.getSelectedGroup().RFQ_GROUP_ID || 1;
	},

	getGroupName() {
		return this.getSelectedGroup().GROUP_NAME || 'Consulting Services';
	},

	// ============================================================================
	// MULTI-ROUND STATE & HISTORICAL REVIEW
	// ============================================================================
	getActiveRound() {
		const grpId = this.getSelectedGroupId();
		const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
		return storeActiveRounds[grpId] || appsmith.store.active_sourcing_round || this.getSelectedGroup().activeRound || 1;
	},

	getViewingRound() {
		const activeR = this.getActiveRound();
		const viewing = appsmith.store.viewing_sourcing_round;
		return viewing ? Number(viewing) : activeR;
	},

	isHistoricalRound() {
		return this.getViewingRound() < this.getActiveRound();
	},

	isCreateNextDisabled() {
		return this.getActiveRound() >= 4 || this.isHistoricalRound();
	},

	getCreateNextTooltip() {
		if (this.isHistoricalRound()) {
			return 'Return to active round RFP ' + this.getActiveRound() + ' to raise next round';
		}
		if (this.getActiveRound() >= 4) {
			return 'Maximum 4 negotiation rounds reached';
		}
		return 'Create next round RFP with revised conditions or requirements';
	},

	// Header Information Helpers
	getStatusBadgeText() {
		return 'Completed';
	},

	getSubtitleText() {
		const grp = this.getSelectedGroup();
		if (grp && grp.RFQ_DATA_JSON && grp.RFQ_DATA_JSON.RFP_SEQUENCE_NUMBER) {
			return grp.RFQ_DATA_JSON.RFP_SEQUENCE_NUMBER;
		}
		return 'RFQ-2026-000567';
	},

	// Summary Cards Metrics
	getSummaryMetrics() {
		return {
			vendorsInvited: 8,
			vendorsQualified: 6,
			vendorsRejected: 2,
			vendorsEligible: 6
		};
	},

	// Comparison Sheet Generation
	// async generateComparisonSheet() {
		// showAlert('Commercial Comparison Sheet generated successfully.', 'success');
	// },
// Comparison Sheet Generation
async generateComparisonSheet() {

  // Prevent the action from running more than once
  if (appsmith.store.commercialComparisonGenerated === true) {
    return;
  }

  // Mark as generated — this will disable the button
  await storeValue("commercialComparisonGenerated", true,false);

  showAlert(
    "Commercial Comparison Sheet generated successfully.",
    "success"
  );
},
	// Commercial Summary Table Data
	getCommercialTableData() {
		return [
			{
				slNo: 1,
				vendorName: 'ARCHICLAD FACADES LLP',
				quotedAmount: '₹ 1,28,45,000',
				discount: '3.5%',
				finalCommercial: '₹ 1,23,95,425',
				paymentTerms: 'Net 30 Days',
				deliveryTimeline: '6 Weeks',
				rank: 'L1',
				action: 'View Quotation'
			},
			{
				slNo: 2,
				vendorName: 'TECHNO VALVES & FITTINGS',
				quotedAmount: '₹ 1,32,10,000',
				discount: '2.0%',
				finalCommercial: '₹ 1,29,45,800',
				paymentTerms: 'Net 30 Days',
				deliveryTimeline: '5 Weeks',
				rank: 'L2',
				action: 'View Quotation'
			},
			{
				slNo: 3,
				vendorName: 'APOLLO CRANES & SERVICES',
				quotedAmount: '₹ 1,36,80,000',
				discount: '4.0%',
				finalCommercial: '₹ 1,31,32,800',
				paymentTerms: 'Net 45 Days',
				deliveryTimeline: '8 Weeks',
				rank: 'L3',
				action: 'View Quotation'
			},
			{
				slNo: 4,
				vendorName: 'BHARAT HEAVY CONSTRUCTIONS',
				quotedAmount: '₹ 1,41,50,000',
				discount: '1.5%',
				finalCommercial: '₹ 1,39,37,750',
				paymentTerms: 'Net 30 Days',
				deliveryTimeline: '7 Weeks',
				rank: 'L4',
				action: 'View Quotation'
			},
			{
				slNo: 5,
				vendorName: 'SHREE GANESH INFRA',
				quotedAmount: '₹ 1,45,20,000',
				discount: '2.5%',
				finalCommercial: '₹ 1,41,57,000',
				paymentTerms: 'Net 60 Days',
				deliveryTimeline: '9 Weeks',
				rank: 'L5',
				action: 'View Quotation'
			},
			{
				slNo: 6,
				vendorName: 'KINETIC LOGISTICS & SUPPLY',
				quotedAmount: '₹ 1,49,90,000',
				discount: '3.0%',
				finalCommercial: '₹ 1,45,40,300',
				paymentTerms: 'Net 30 Days',
				deliveryTimeline: '6 Weeks',
				rank: 'L6',
				action: 'View Quotation'
			}
		];
	},

	// Stage Progression & Locking
	isNextDisabled() {
		if (this.isHistoricalRound()) {
			return true;
		}
		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		const stage = groupStages[grpId] || 'commercial';
		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const commIdx = stageOrder.indexOf('commercial');

		if (stageIdx > commIdx) {
			return true;
		}
		return false;
	},

	async proceedToNextStage() {
		if (this.isHistoricalRound()) {
			showAlert('Cannot advance to Negotiation from a historical round. Please return to the active round.', 'warning');
			return;
		}
		if (this.isNextDisabled()) {
			showAlert('Stage already advanced.', 'info');
			return;
		}

		// Advance active RFQ group to Stage 09 (ENFA)
		const grpId = this.getSelectedGroupId();
		const groupStages = { ...(appsmith.store.rfq_group_stages || {}) };
		groupStages[grpId] = 'negotiation';
		await storeValue('rfq_group_stages', groupStages);

		await storeValue('viewing_stage_id', 'negotiation');
		showAlert('Commercial Evaluation Cleared! Navigating to Stage 09 (Negotiation)...', 'success');
		await js_NavigationController.handleStageSelect('negotiation');
	},

	// Raise Next Round of RFP (Max 4 Rounds)
	async handleCreateNextRound() {
		if (this.isHistoricalRound()) {
			showAlert('Cannot raise next round from a historical archive. Switch to the active round first.', 'warning');
			return false;
		}

		const grpId = this.getSelectedGroupId();
		const currentRound = this.getActiveRound();

		if (currentRound >= 4) {
			showAlert('Maximum 4 sourcing rounds reached for this RFQ group.', 'warning');
			return false;
		}

		const nextRound = currentRound + 1;
		showAlert('Initiating Round ' + nextRound + ' (RFP ' + nextRound + '). Returning to Stage 05 (Send RFP) in Draft mode...', 'info');

		// 1. Update active round and viewing round
		const storeActiveRounds = { ...(appsmith.store.rfq_group_active_rounds || {}) };
		storeActiveRounds[grpId] = nextRound;
		await storeValue('rfq_group_active_rounds', storeActiveRounds);
		await storeValue('active_sourcing_round', nextRound);
		await storeValue('viewing_sourcing_round', nextRound);

		// 2. Set this group's stage back to 'send_rfp' (Stage 05)
		const groupStages = { ...(appsmith.store.rfq_group_stages || {}) };
		groupStages[grpId] = 'send_rfp';
		await storeValue('rfq_group_stages', groupStages);

		// 3. Reset Send RFP simulation step to 5 (Draft Created)
		const stepKey = Number(grpId) === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		await storeValue(stepKey, 5);

		// 4. Reset Bid Monitoring step to 1 (Pending)
		const bidKey = Number(grpId) === 2 ? 'bid_mon_sim_step_g2' : 'bid_mon_sim_step';
		await storeValue(bidKey, 1);

		// 5. Navigate to Stage 05 (Send RFP)
		await storeValue('viewing_stage_id', 'send_rfp');
		await js_NavigationController.handleStageSelect('send_rfp');
		showAlert('Round ' + nextRound + ' initiated successfully! Sourcing Draft is ready for revision.', 'success');
		return true;
	}
};
