export default {
	// ============================================================================
	// GROUP & ROUND CONTEXT
	// ============================================================================
	getSelectedGroup() {
		const storeGroup = appsmith.store.selected_vendor_group;
		if (storeGroup && storeGroup.RFQ_GROUP_ID) {
			const allGroups = js_MockData.getVendorGroups() || [];
			const matched = allGroups.find(g => Number(g.RFQ_GROUP_ID) === Number(storeGroup.RFQ_GROUP_ID));
			return matched || storeGroup;
		}
		const allGroups = js_MockData.getVendorGroups() || [];
		return allGroups[0] || {};
	},

	getSelectedGroupId() {
		return this.getSelectedGroup().RFQ_GROUP_ID || 1;
	},

	getGroupName() {
		return this.getSelectedGroup().GROUP_NAME || 'Consulting Services';
	},

	getActiveRound() {
		const grp = this.getSelectedGroup();
		const storeActiveRounds = appsmith.store.rfq_group_active_rounds || {};
		return storeActiveRounds[grp.RFQ_GROUP_ID] || appsmith.store.active_sourcing_round || grp.activeRound || 1;
	},

	getViewingRound() {
		const grp = this.getSelectedGroup();
		const activeR = this.getActiveRound();
		const viewing = appsmith.store.viewing_sourcing_round;
		return viewing ? Number(viewing) : activeR;
	},

	isHistoricalRound() {
		return this.getViewingRound() < this.getActiveRound();
	},

	getRoundBadgeText() {
		return '';
	},

	getStatusBadgeText() {
		return 'Evaluation completed';
	},

	getSubtitleText() {
		return 'RFQ-2026-000567 · Technical envelope opened 28 May';
	},

	// ============================================================================
	// SUMMARY METRICS MODEL (6 COLUMNS)
	// ============================================================================
	getMetrics() {
		return [
			{ id: 'eventType', label: 'EVENT TYPE', value: 'RFP', color: '#0f172a' },
			{ id: 'evaluator', label: 'EVALUATOR', value: 'Technical Team', color: '#0f172a' },
			{ id: 'status', label: 'STATUS', value: 'Evaluation Completed', color: '#2563eb' },
			{ id: 'invited', label: 'INVITED', value: '8', color: '#0f172a' },
			{ id: 'evaluated', label: 'EVALUATED', value: '8', color: '#0f172a' },
			{ id: 'qualified', label: 'QUALIFIED', value: '6', color: '#059669' }
		];
	},

	// ============================================================================
	// SUPPLIERS DATASET (ROUND 3 AUDIT)
	// ============================================================================
	getAllSuppliers() {
		return [
			{
				id: 1,
				supplier: 'Techno Valves Pvt Ltd',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Qualified',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 92,
							documentsFound: 'Specification Sheet, Datasheet',
							documentsMissing: '—',
							tqQueryStatus: 'Cleared in R1'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 86,
							documentsFound: 'ISO 9001, Test Certificate',
							documentsMissing: '—',
							tqQueryStatus: 'Verified in R2'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 88,
							documentsFound: 'Signed Declarations',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 2,
				supplier: 'Industrial Solutions Ltd',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Qualified',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 90,
							documentsFound: 'Product Catalog, CAD Drawings',
							documentsMissing: '—',
							tqQueryStatus: 'Cleared in R1'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 84,
							documentsFound: 'CE Certification, Warranty Letter',
							documentsMissing: '—',
							tqQueryStatus: 'Verified in R2'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 85,
							documentsFound: 'Signed Compliance Undertaking',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 3,
				supplier: 'Valve Experts India Pvt Ltd',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Qualified',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 89,
							documentsFound: 'Valve Datasheet, Performance Curves',
							documentsMissing: '—',
							tqQueryStatus: 'Cleared in R1'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 88,
							documentsFound: 'API 6D Certificate, Material Test Report',
							documentsMissing: '—',
							tqQueryStatus: 'Verified in R1'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 86,
							documentsFound: 'Declaration of Conformance',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 4,
				supplier: 'Precision Flow Systems',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Qualified',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 91,
							documentsFound: 'Engineering Drawings, Sizing Sheet',
							documentsMissing: '—',
							tqQueryStatus: 'Cleared in R2'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 85,
							documentsFound: 'ISO 14001, Factory Acceptance Certificate',
							documentsMissing: '—',
							tqQueryStatus: 'Verified in R2'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 87,
							documentsFound: 'Anti-Collusion Declaration',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 5,
				supplier: 'Apex Flow Controls Ltd',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Qualified',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 88,
							documentsFound: 'Specification Schedule, Inspection Plan',
							documentsMissing: '—',
							tqQueryStatus: 'Cleared in R1'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 82,
							documentsFound: 'Type Test Report, Calibration Cert',
							documentsMissing: '—',
							tqQueryStatus: 'Verified in R2'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 84,
							documentsFound: 'Vendor Code of Conduct',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 6,
				supplier: 'Delta Engineering Works',
				documentStatus: 'Non-Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Rejected',
				compliance: {
					overallStatus: 'Non-Compliant',
					badgeBg: '#fef2f2',
					badgeColor: '#dc2626',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 45,
							documentsFound: 'Incomplete Datasheet',
							documentsMissing: 'Hydrostatic Test Report, Torque Calculation',
							tqQueryStatus: 'Unresolved in R2'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 52,
							documentsFound: 'Expired ISO Certificate',
							documentsMissing: 'Valid ISO 9001, NABL Test Report',
							tqQueryStatus: 'Rejected'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 60,
							documentsFound: 'Draft Declarations',
							documentsMissing: 'Authorized Signatory POA',
							tqQueryStatus: 'Pending'
						}
					]
				}
			},
			{
				id: 7,
				supplier: 'Kaveri Fluidics Ltd',
				documentStatus: 'Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Resolved in R2',
				compliance: {
					overallStatus: 'Compliant',
					badgeBg: '#ecfdf5',
					badgeColor: '#059669',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 82,
							documentsFound: 'Revised Specs, Compliance Matrix',
							documentsMissing: '—',
							tqQueryStatus: 'Resolved in R2'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 80,
							documentsFound: 'QA/QC Manual, Welder Qualification',
							documentsMissing: '—',
							tqQueryStatus: 'Resolved in R2'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 85,
							documentsFound: 'Signed BAFO Addendum',
							documentsMissing: '—',
							tqQueryStatus: 'Completed'
						}
					]
				}
			},
			{
				id: 8,
				supplier: 'Omega Valves & Pumps',
				documentStatus: 'Non-Compliant',
				reviewedBy: 'Technical Team',
				reviewedOn: '02 Jun 2026',
				technicalEvaluationStatus: 'Rejected',
				compliance: {
					overallStatus: 'Non-Compliant',
					badgeBg: '#fef2f2',
					badgeColor: '#dc2626',
					subtitle: 'Specification and quality criteria review (Round 3 Audit)',
					categories: [
						{
							categoryName: 'Technical Specification',
							rating: 38,
							documentsFound: 'Preliminary Brochure',
							documentsMissing: 'Complete Technical Bid, Bill of Materials',
							tqQueryStatus: 'Rejected'
						},
						{
							categoryName: 'Quality Certificates',
							rating: 40,
							documentsFound: 'None',
							documentsMissing: 'All Quality Certifications',
							tqQueryStatus: 'Rejected'
						},
						{
							categoryName: 'Commercial Declarations',
							rating: 50,
							documentsFound: 'Partial Form',
							documentsMissing: 'Integrity Pact',
							tqQueryStatus: 'Rejected'
						}
					]
				}
			}
		];
	},

	// ============================================================================
	// SELECTION STATE MANAGEMENT
	// ============================================================================
	getSelectedSupplierId() {
		return appsmith.store.tech_eval_selected_supplier_id || 1;
	},

	getSelectedSupplier() {
		const suppliers = this.getAllSuppliers();
		const currentId = this.getSelectedSupplierId();
		return suppliers.find(s => s.id === currentId) || suppliers[0];
	},

	getSelectedSupplierName() {
		return this.getSelectedSupplier().supplier;
	},

	getSelectedSupplierComplianceBadge() {
		return this.getSelectedSupplier().compliance.overallStatus;
	},

	getSelectedSupplierComplianceData() {
		return this.getSelectedSupplier().compliance;
	},

	async handleSupplierSelect(supplierId) {
		let targetId = 1;
		if (supplierId && typeof supplierId === 'object' && supplierId.id) {
			targetId = Number(supplierId.id) || 1;
		} else if (supplierId) {
			targetId = Number(supplierId) || 1;
		}
		await storeValue('tech_eval_selected_supplier_id', targetId);
		const s = this.getAllSuppliers().find(x => x.id === targetId);
		if (s) {
			showAlert(`Selected Supplier: ${s.supplier} (${s.technicalEvaluationStatus})`, 'info');
		}
	},

	// ============================================================================
	// TABLE MODELS FOR WIDGETS
	// ============================================================================
	getSupplierTableData() {
		return this.getAllSuppliers().map(s => ({
			id: s.id,
			supplier: s.supplier,
			documentStatus: s.documentStatus,
			reviewedBy: s.reviewedBy,
			reviewedOn: s.reviewedOn,
			technicalEvaluationStatus: s.technicalEvaluationStatus
		}));
	},

	getComplianceTableData() {
		const current = this.getSelectedSupplier();
		return (current && current.compliance && current.compliance.categories) || [];
	},

	// ============================================================================
	// STAGE PROGRESSION & NEXT BUTTON
	// ============================================================================
	isNextDisabled() {
		if (this.isHistoricalRound()) return true;
		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		const stage = groupStages[grpId] || 'technical_evaluation';
		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const techEvalIdx = stageOrder.indexOf('technical_evaluation');

		// If this group has already advanced past Stage 07 (Technical Evaluation): Lock / disable Next button
		if (stageIdx > techEvalIdx) {
			return true;
		}

		// Evaluation completed: Unlocked and ready to proceed!
		return false;
	},

	async proceedToNextStage() {
		if (this.isHistoricalRound()) {
			showAlert('Cannot proceed from historical archive. Return to active round.', 'warning');
			return;
		}
		if (this.isNextDisabled()) {
			showAlert('Stage already advanced.', 'info');
			return;
		}

		// Advance active RFQ group to Stage 08 (Commercial)
		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		groupStages[grpId] = 'commercial';
		await storeValue('rfq_group_stages', groupStages);

		await storeValue('viewing_stage_id', 'commercial');
		showAlert('Technical Evaluation Cleared! Navigating to Stage 08 (Commercial)...', 'success');
		await js_NavigationController.handleStageSelect('commercial');
	}
};
