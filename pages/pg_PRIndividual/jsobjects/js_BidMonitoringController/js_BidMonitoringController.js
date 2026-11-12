export default {
	// ============================================================================
	// MULTI-RFQ GROUP CONTEXT & DATA RESOLUTION
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

	getRfqNumber() {
		const grp = this.getSelectedGroup();
		if (grp.RFQ_DATA_JSON) {
			const parsed = typeof grp.RFQ_DATA_JSON === 'string' ? JSON.parse(grp.RFQ_DATA_JSON) : grp.RFQ_DATA_JSON;
			if (parsed.RFQ_Number || parsed.PR_Number) {
				return 'RFQ-2026-000567';
			}
		}
		return 'RFQ-2026-000567';
	},

	getActiveRound() {
		const grp = this.getSelectedGroup();
		return grp.activeRound || appsmith.store.active_sourcing_round || 3;
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

	// ============================================================================
	// 8-STAGE PROGRESSION & SIMULATION ENGINE
	// Stages 1-6 are ALWAYS completed by default.
	// Step 7: Bidding in Progress
	// Step 8: Event Closing
	// Step 9: All Completed (Next Unlocked)
	// ============================================================================
	getSimStep() {
		if (this.isHistoricalRound()) {
			return 8; // Historical rounds are 100% completed/closed
		}
		const grpId = this.getSelectedGroupId();
		const storeKey = Number(grpId) === 2 ? 'bid_mon_sim_step_g2' : 'bid_mon_sim_step';
		const step = appsmith.store[storeKey];
		return step ? Number(step) : 7; // Default: Stage 7 (Bidding in Progress)
	},

	getStepCounterText() {
		const step = this.getSimStep();
		return (this.isHistoricalRound() || step >= 8) ? 'Event Closed' : 'Bidding in Progress';
	},

	getSimButtonText() {
		const step = this.getSimStep();
		if (this.isHistoricalRound()) {
			return 'Historical Archive';
		}
		return step >= 8 ? 'Reopen Bidding' : 'Simulate Close Event';
	},

	async simulateProgress() {
		if (this.isHistoricalRound()) {
			showAlert(`Viewing historical round ${this.getViewingRound()}. Switch to Active Round to simulate.`, 'info');
			return;
		}
		const grpId = this.getSelectedGroupId();
		const storeKey = Number(grpId) === 2 ? 'bid_mon_sim_step_g2' : 'bid_mon_sim_step';
		const cur = this.getSimStep();

		if (cur >= 8) {
			await storeValue(storeKey, 7);
			showAlert('Simulation Reset: Bidding in Progress.', 'info');
		} else {
			await storeValue(storeKey, 8);
			showAlert('Event Closed! Bids locked for Technical Evaluation (Next button unlocked).', 'success');
		}
	},

	isNextDisabled() {
		if (this.isHistoricalRound()) return true;
		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		const grp = this.getSelectedGroup();
		const stage = groupStages[grpId] || (grp && grp.STATUS === 'SEND_RFP' ? 'send_rfp' : 'rfp_generation');
		const stageOrder = ['oa_arc_check', 'consistency_check', 'vendor_recommendation', 'rfp_generation', 'send_rfp', 'bid_monitoring', 'technical_evaluation', 'commercial', 'negotiation', 'enfa'];
		const stageIdx = stageOrder.indexOf(stage);
		const bidMonIdx = stageOrder.indexOf('bid_monitoring');

		if (stageIdx > bidMonIdx) {
			return true;
		}
		return this.getSimStep() < 8;
	},

	async proceedToNextStage() {
		if (this.isHistoricalRound()) {
			showAlert('Cannot proceed from historical archive. Return to active round.', 'warning');
			return;
		}
		if (this.isNextDisabled()) {
			showAlert('Event must be closed before proceeding to Technical Evaluation.', 'warning');
			return;
		}

		// Advance group stage to Stage 07 (Technical Evaluation)
		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		groupStages[grpId] = 'technical_evaluation';
		await storeValue('rfq_group_stages', groupStages);
		await storeValue('viewing_stage_id', 'technical_evaluation');
		showAlert('Bids Closed & Evaluated! Navigating to Technical Evaluation (Stage 07)...', 'success');
		await js_NavigationController.handleStageSelect('technical_evaluation');
	},

	// ============================================================================
	// VECTOR SVG ICONS
	// ============================================================================
	_getCheckSvg(color = '#059669', size = 14) {
		return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
	},

	_getSpinnerSvg(color = '#2563eb', size = 14) {
		return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
	},

	// ============================================================================
	// 8 MILESTONE STEP BOXES MODEL
	// Stages 1 to 6 are 100% completed by default.
	// Stages 7 & 8 are dynamic based on getSimStep().
	// ============================================================================
	getStepBox(stepNum) {
		const cur = this.getSimStep();

		// Default timestamps / titles for the 8 stages
		const stepDefinitions = [
			{ id: 1, title: 'Request Submit', time: '08 Jun · 11:00 AM' },
			{ id: 2, title: 'SAP Processing', time: '08 Jun · 11:15 AM' },
			{ id: 3, title: 'RFQ Created in SAP', time: '08 Jun · 11:30 AM' },
			{ id: 4, title: 'Ariba Sync', time: '08 Jun · 11:35 AM' },
			{ id: 5, title: 'Draft Created', time: '08 Jun · 11:40 AM' },
			{ id: 6, title: 'Published', time: '08 Jun · 11:45 AM' },
			{ id: 7, title: 'Bidding in Progress', time: 'Ends 04 Jun' },
			{ id: 8, title: 'Event Closing', time: 'Scheduled' }
		];

		const def = stepDefinitions[stepNum - 1] || { id: stepNum, title: 'Step ' + stepNum, time: '—' };

		// Stages 1 through 6 are ALWAYS completed by default
		if (stepNum <= 6) {
			return {
				isDone: true,
				isActive: false,
				title: def.title,
				statusText: 'Completed',
				borderColor: '#10b981',
				bgColor: '#f0fdf4',
				iconHtml: this._getCheckSvg('#059669', 14)
			};
		}

		// Stage 7: Bidding in Progress
		if (stepNum === 7) {
			const isDone = cur >= 8;
			const isActive = cur === 7;
			return {
				isDone,
				isActive,
				title: def.title,
				statusText: isDone ? 'Completed' : 'Ends 04 Jun',
				borderColor: isDone ? '#10b981' : (isActive ? '#2563eb' : '#e2e8f0'),
				bgColor: isDone ? '#f0fdf4' : (isActive ? '#f8faff' : '#ffffff'),
				iconHtml: isDone ? this._getCheckSvg('#059669', 14) : (isActive ? this._getSpinnerSvg('#2563eb', 14) : `<span style="font-weight:700;font-size:11px;color:#94a3b8;">7</span>`)
			};
		}

		// Stage 8: Event Closing
		if (stepNum === 8) {
			const isDone = cur >= 9;
			const isActive = cur === 8;
			return {
				isDone,
				isActive,
				title: def.title,
				statusText: isDone ? 'Closed' : (isActive ? 'Closing Review' : 'Scheduled'),
				borderColor: isDone ? '#10b981' : (isActive ? '#2563eb' : '#e2e8f0'),
				bgColor: isDone ? '#f0fdf4' : (isActive ? '#f8faff' : '#ffffff'),
				iconHtml: isDone ? this._getCheckSvg('#059669', 14) : (isActive ? this._getSpinnerSvg('#2563eb', 14) : `<span style="font-weight:700;font-size:11px;color:#94a3b8;">8</span>`)
			};
		}

		return {
			isDone: false,
			isActive: false,
			title: 'Stage ' + stepNum,
			statusText: 'Pending',
			borderColor: '#e2e8f0',
			bgColor: '#ffffff',
			iconHtml: ''
		};
	},

	// ============================================================================
	// HEADER BANNER & SOURCING ROUND CONTROLS (NO CYCLE ID & NO ROUND 3 OF 3 TEXT)
	// ============================================================================
	getHeaderHtml() {
		const groupName = this.getGroupName();
		const rfqNumber = this.getRfqNumber();
		const vRound = this.getViewingRound();

		return `
		<div style="font-family: Inter, sans-serif; padding: 2px 0 6px 0;">
			<!-- Top Sourcing Round Switcher Sub-Ribbon -->
			<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
				<div style="display: flex; align-items: center; gap: 8px;">
					<span style="font-size: 11px; font-weight: 700; color: #475569; letter-spacing: 0.5px; text-transform: uppercase;">⚡ SOURCING ROUND:</span>
					<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 14px; background: ${vRound === 1 ? '#2563eb' : '#f1f5f9'}; color: ${vRound === 1 ? '#ffffff' : '#475569'}; font-size: 12px; font-weight: 600;">1 Round 1 (Initial)</span>
					<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 14px; background: ${vRound === 2 ? '#2563eb' : '#f1f5f9'}; color: ${vRound === 2 ? '#ffffff' : '#475569'}; font-size: 12px; font-weight: 600;">2 Round 2 (Revised)</span>
					<span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 14px; background: ${vRound === 3 ? '#2563eb' : '#f1f5f9'}; color: ${vRound === 3 ? '#ffffff' : '#475569'}; font-size: 12px; font-weight: 700; box-shadow: 0 1px 2px rgba(37,99,235,0.2);">
						3 Round 3 (Final BAFO) <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #4ade80;"></span>
					</span>
				</div>
				<div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-weight: 600;">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
					Audit Trail & Round History
				</div>
			</div>

			<!-- Main Title Bar: Dynamic Group Name, RFQ reference, NO cycle ID, NO round 3 of 3 text -->
			<div style="display: flex; align-items: center; justify-content: space-between;">
				<div>
					<div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">RFP EVENT DETAILS</div>
					<div style="font-size: 24px; font-weight: 800; color: #0f172a; line-height: 28px;">${groupName}</div>
					<div style="font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px;">${rfqNumber}</div>
				</div>
				<div>
					<span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 16px; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; border: 1px solid #bbf7d0;">
						<span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #16a34a;"></span>
						Published & Active
					</span>
				</div>
			</div>
		</div>
		`;
	},

	// ============================================================================
	// KPI CARDS: PARTICIPATION & COUNTDOWN TIMER
	// ============================================================================
	getParticipationHtml() {
		return `
		<div style="font-family: Inter, sans-serif; padding: 6px 4px;">
			<div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">Participation (5 Qualified Vendors)</div>
			<div style="font-size: 32px; font-weight: 800; color: #0f172a; line-height: 36px; margin-bottom: 12px;">5</div>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
				<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
					<div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Responded</div>
					<div style="font-size: 20px; font-weight: 700; color: #059669;">5</div>
				</div>
				<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
					<div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Not Responded</div>
					<div style="font-size: 20px; font-weight: 700; color: #64748b;">0</div>
				</div>
			</div>
		</div>
		`;
	},

	getTimerHtml() {
		const vRound = this.getViewingRound();
		return `
		<div style="font-family: Inter, sans-serif; padding: 6px 4px;">
			<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
				<div style="font-size: 13px; font-weight: 700; color: #334155;">Round ${vRound} Timer</div>
				<span style="background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Active</span>
			</div>
			<div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 6px;">
				<div style="text-align: center;">
					<span style="font-size: 32px; font-weight: 800; color: #0f172a; font-family: monospace; letter-spacing: -1px;">06</span>
					<div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Days</div>
				</div>
				<span style="font-size: 26px; font-weight: 700; color: #94a3b8;">:</span>
				<div style="text-align: center;">
					<span style="font-size: 32px; font-weight: 800; color: #0f172a; font-family: monospace; letter-spacing: -1px;">02</span>
					<div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Hours</div>
				</div>
				<span style="font-size: 26px; font-weight: 700; color: #94a3b8;">:</span>
				<div style="text-align: center;">
					<span style="font-size: 32px; font-weight: 800; color: #0f172a; font-family: monospace; letter-spacing: -1px;">15</span>
					<div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Mins</div>
				</div>
			</div>
			<div style="font-size: 11px; color: #64748b; font-weight: 500;">Deadline: 04 Jun 2026, 06:00 PM IST</div>
		</div>
		`;
	},

	// ============================================================================
	// INNER TABBED CARD: EVENT DETAILS & BUYER ACTIONS
	// ============================================================================
	getInnerTab() {
		return appsmith.store.bid_monitoring_inner_tab || 'event_details';
	},

	async setInnerTab(tabKey) {
		await storeValue('bid_monitoring_inner_tab', tabKey);
	},

	getDetailsCardHtml() {
		const activeTab = this.getInnerTab();
		const groupName = this.getGroupName();
		const vRound = this.getViewingRound();

		const tabs = [
			{ key: 'event_details', label: 'Event Details' },
			{ key: 'vendors', label: 'Vendors (5)' },
			{ key: 'bids', label: 'Bids (5)' },
			{ key: 'reminders', label: 'Reminders' },
			{ key: 'history', label: '⏱ Round History & Addendums' }
		];

		const tabsHeader = tabs.map(t => {
			const isSel = t.key === activeTab;
			return `<span style="display:inline-block;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:${isSel ? '700' : '500'};color:${isSel ? '#2563eb' : '#64748b'};border-bottom:${isSel ? '2px solid #2563eb' : '2px solid transparent'};margin-right:12px;">${t.label}</span>`;
		}).join('');

		if (activeTab === 'vendors') {
			return `
			<div style="font-family: Inter, sans-serif; padding: 4px;">
				<div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 16px;">${tabsHeader}</div>
				<div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 12px;">Invited Qualified Vendors (5)</div>
				<table style="width:100%;border-collapse:collapse;font-size:12px;">
					<thead><tr style="background:#f8fafc;color:#475569;text-align:left;border-bottom:1px solid #e2e8f0;"><th style="padding:8px;">Vendor Name</th><th style="padding:8px;">Response Status</th><th style="padding:8px;">Submission Time</th><th style="padding:8px;">Contact</th></tr></thead>
					<tbody>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">ABB India Ltd.</td><td style="padding:8px;color:#059669;font-weight:700;">✓ Responded</td><td style="padding:8px;">03 Jun, 02:15 PM</td><td style="padding:8px;color:#64748b;">bid.team@abb.in</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">Siemens Energy</td><td style="padding:8px;color:#059669;font-weight:700;">✓ Responded</td><td style="padding:8px;">03 Jun, 03:40 PM</td><td style="padding:8px;color:#64748b;">sales@siemens.com</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">Schneider Electric</td><td style="padding:8px;color:#059669;font-weight:700;">✓ Responded</td><td style="padding:8px;">03 Jun, 05:20 PM</td><td style="padding:8px;color:#64748b;">tenders@se.com</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">L&T Electrical & Automation</td><td style="padding:8px;color:#059669;font-weight:700;">✓ Responded</td><td style="padding:8px;">04 Jun, 10:10 AM</td><td style="padding:8px;color:#64748b;">ea.bids@lntebg.com</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">General Electric Grid</td><td style="padding:8px;color:#059669;font-weight:700;">✓ Responded</td><td style="padding:8px;">04 Jun, 11:45 AM</td><td style="padding:8px;color:#64748b;">grid.solutions@ge.com</td></tr>
					</tbody>
				</table>
			</div>
			`;
		}

		if (activeTab === 'bids') {
			return `
			<div style="font-family: Inter, sans-serif; padding: 4px;">
				<div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 16px;">${tabsHeader}</div>
				<div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 12px;">Comparative Bids Log (Round 3 BAFO)</div>
				<table style="width:100%;border-collapse:collapse;font-size:12px;">
					<thead><tr style="background:#f8fafc;color:#475569;text-align:left;border-bottom:1px solid #e2e8f0;"><th style="padding:8px;">Vendor</th><th style="padding:8px;">Round 1 Bid</th><th style="padding:8px;">Round 2 Bid</th><th style="padding:8px;">Round 3 BAFO</th><th style="padding:8px;">Savings vs R1</th><th style="padding:8px;">Rank</th></tr></thead>
					<tbody>
						<tr style="border-bottom:1px solid #f1f5f9;background:#f0fdf4;"><td style="padding:8px;font-weight:700;color:#15803d;">ABB India Ltd.</td><td style="padding:8px;">₹ 2,70,000</td><td style="padding:8px;">₹ 2,50,000</td><td style="padding:8px;font-weight:800;color:#15803d;">₹ 2,35,000</td><td style="padding:8px;color:#059669;font-weight:700;">-12.9%</td><td style="padding:8px;font-weight:800;color:#15803d;">L1</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">Siemens Energy</td><td style="padding:8px;">₹ 2,80,000</td><td style="padding:8px;">₹ 2,60,000</td><td style="padding:8px;font-weight:700;">₹ 2,42,000</td><td style="padding:8px;color:#059669;">-13.5%</td><td style="padding:8px;font-weight:700;">L2</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">Schneider Electric</td><td style="padding:8px;">₹ 2,95,000</td><td style="padding:8px;">₹ 2,75,000</td><td style="padding:8px;font-weight:700;">₹ 2,55,000</td><td style="padding:8px;color:#059669;">-13.5%</td><td style="padding:8px;font-weight:700;">L3</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">L&T Electrical & Automation</td><td style="padding:8px;">₹ 3,10,000</td><td style="padding:8px;">₹ 2,90,000</td><td style="padding:8px;font-weight:700;">₹ 2,68,000</td><td style="padding:8px;color:#059669;">-13.5%</td><td style="padding:8px;font-weight:700;">L4</td></tr>
						<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">General Electric Grid</td><td style="padding:8px;">₹ 3,25,000</td><td style="padding:8px;">₹ 3,05,000</td><td style="padding:8px;font-weight:700;">₹ 2,85,000</td><td style="padding:8px;color:#059669;">-12.3%</td><td style="padding:8px;font-weight:700;">L5</td></tr>
					</tbody>
				</table>
			</div>
			`;
		}

		// Default Tab: Event Details
		return `
		<div style="font-family: Inter, sans-serif; padding: 4px;">
			<!-- Tabs Row -->
			<div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 16px;">${tabsHeader}</div>

			<!-- Section Header -->
			<div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 14px;">Event Information - Round ${vRound}</div>

			<!-- 2-Column Key Value Grid -->
			<div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 32px; row-gap: 12px; margin-bottom: 24px;">
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Event Name</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">${groupName}</span>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Evaluation Method</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">Lowest Price (L1 with TQ Filter)</span>
				</div>

				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Active Round</span>
					<span style="font-size: 12px; color: #2563eb; font-weight: 700;">Round ${vRound} (BAFO)</span>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Invited Vendors</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">5 Qualified Vendors</span>
				</div>

				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Start Date</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">03 Jun, 11:45 AM</span>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Dispatched Addendums</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">2 Addendums (TQ-01 & BAFO)</span>
				</div>

				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">End Date</span>
					<span style="font-size: 12px; color: #0f172a; font-weight: 700;">04 Jun, 06:00 PM</span>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
					<span style="font-size: 12px; color: #64748b; font-weight: 500;">Cumulative Savings Logged</span>
					<span style="font-size: 12px; color: #059669; font-weight: 800;">₹ 3,45,000 (12.8%)</span>
				</div>
			</div>

			<!-- Buyer Actions Section -->
			<div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Buyer Actions</div>
			<div style="display: flex; flex-direction: column; gap: 10px;">
				<div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #ffffff;">
					<div style="display: flex; align-items: center; gap: 12px;">
						<div style="width: 32px; height: 32px; border-radius: 6px; background: #eff6ff; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 16px;">👥</div>
						<div>
							<div style="font-size: 13px; font-weight: 700; color: #0f172a;">Add Vendors / Issue Counter Offer</div>
							<div style="font-size: 11px; color: #64748b;">Invite additional vendors or send revised counter offer to qualified vendors</div>
						</div>
					</div>
					<div style="font-size: 16px; color: #94a3b8; font-weight: 600;">›</div>
				</div>

				<div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #ffffff;">
					<div style="display: flex; align-items: center; gap: 12px;">
						<div style="width: 32px; height: 32px; border-radius: 6px; background: #eff6ff; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 16px;">📅</div>
						<div>
							<div style="font-size: 13px; font-weight: 700; color: #0f172a;">Extend Timeline for Round ${vRound}</div>
							<div style="font-size: 11px; color: #64748b;">Request extension or dispatch round closure alert</div>
						</div>
					</div>
					<div style="font-size: 16px; color: #94a3b8; font-weight: 600;">›</div>
				</div>
			</div>
		</div>
		`;
	},

	// ============================================================================
	// NEW MODERN SCREEN METHODS (MATCHING USER SCREENSHOT)
	// ============================================================================
	getCountdownHtml() {
		return `<div style="display:flex;align-items:center;justify-content:flex-end;width:100%;height:100%;box-sizing:border-box;"><div style="display:inline-flex;align-items:center;gap:12px;background:#ffffff;border:1.5px solid #cbd5e1;border-radius:12px;padding:8px 18px;box-shadow:0 2px 6px rgba(0,0,0,0.03);white-space:nowrap;"><span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#f8fafc;color:#475569;font-size:20px;border:1.5px solid #cbd5e1;">⏱</span><div style="display:flex;flex-direction:column;text-align:left;"><span style="font-size:10px;font-weight:700;color:#64748b;line-height:1.2;text-transform:uppercase;letter-spacing:0.5px;font-family:Inter,sans-serif;">Time remaining</span><span style="font-size:20px;font-weight:900;color:#0f172a;line-height:1.1;font-family:Inter,monospace;letter-spacing:0.5px;">00:28:08</span></div></div></div>`;
	},

	onAddVendorsClick() {
		showAlert('Add Vendors / Issue Counter Offer: Modal opened to invite additional suppliers.', 'info');
	},

	onExtendTimelineClick() {
		showAlert('Extend Timeline: Timeline extension request submitted for Round ' + this.getActiveRound() + '.', 'info');
	},

	onAddMemberClick() {
		showAlert('Add Member: Evaluation committee invitation sent.', 'success');
	},

	getHeaderStatusHtml() {
		const step = this.getSimStep();
		const isClosed = step >= 8 || this.isHistoricalRound();
		let s;
		if (isClosed) {
			s = { label: 'Event Closed', bg: '#dcfce7', color: '#15803d', icon: '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#16a34a;margin-right:4px;"></span>' };
		} else {
			s = { label: 'Bidding in Progress', bg: '#eff6ff', color: '#1d4ed8', icon: '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#2563eb;margin-right:4px;"></span>' };
		}
		return `<div style="width:100%;height:100%;display:flex;justify-content:flex-end;align-items:center;background:transparent;border:none;box-sizing:border-box;"><div style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:5px 14px;white-space:nowrap;width:max-content;max-width:max-content;flex-shrink:0;box-sizing:border-box;"><span style="color:#64748b;font-weight:600;font-size:12px;font-family:Inter,sans-serif;">Status:</span><span style="display:inline-flex;align-items:center;background:${s.bg};color:${s.color};padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;font-family:Inter,sans-serif;">${s.icon}${s.label}</span></div></div>`;
	},

	getParticipationCardHtml() {
		return `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:14px 18px 0 18px;width:100%;box-sizing:border-box;font-family:Inter,sans-serif;user-select:text;-webkit-user-select:text;cursor:text;"><div style="user-select:text;-webkit-user-select:text;cursor:text;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;user-select:text;-webkit-user-select:text;cursor:text;">PARTICIPATION</div><div style="font-size:16px;font-weight:800;color:#0f172a;user-select:text;-webkit-user-select:text;cursor:text;">5 Qualified Vendors</div></div><div style="width:36px;height:36px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:18px;flex-shrink:0;user-select:none;cursor:default;">👥</div></div>`;
	},

	getDatesHtml() {
		return `<div style="display:flex;align-items:center;padding:14px 24px;width:100%;height:100%;box-sizing:border-box;font-family:Inter,sans-serif;user-select:text;-webkit-user-select:text;cursor:text;"><div style="flex:1;display:flex;justify-content:space-between;align-items:center;padding-right:24px;user-select:text;-webkit-user-select:text;cursor:text;"><div style="user-select:text;-webkit-user-select:text;cursor:text;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;user-select:text;-webkit-user-select:text;cursor:text;">START DATE</div><div style="font-size:15px;font-weight:800;color:#0f172a;user-select:text;-webkit-user-select:text;cursor:text;">03 Jun, 11:45 AM</div></div><div style="width:36px;height:36px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:16px;flex-shrink:0;user-select:none;cursor:default;">📅</div></div><div style="width:1px;height:44px;background:#e2e8f0;flex-shrink:0;user-select:none;"></div><div style="flex:1;display:flex;justify-content:space-between;align-items:center;padding-left:24px;user-select:text;-webkit-user-select:text;cursor:text;"><div style="user-select:text;-webkit-user-select:text;cursor:text;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;user-select:text;-webkit-user-select:text;cursor:text;">END DATE</div><div style="font-size:15px;font-weight:800;color:#0f172a;user-select:text;-webkit-user-select:text;cursor:text;">04 Jun, 06:00 PM</div></div><div style="width:36px;height:36px;border-radius:8px;background:#fffbeb;display:flex;align-items:center;justify-content:center;color:#d97706;font-size:16px;flex-shrink:0;user-select:none;cursor:default;">🕒</div></div></div>`;
	},

	getBuyerActionsHtml() {
		return `<div style="width:100%;height:100%;font-family:Inter,sans-serif;box-sizing:border-box;"><div style="font-size:12px;font-weight:800;color:#334155;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:12px;">BUYER ACTIONS</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,0.02);cursor:pointer;"><div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:#eff6ff;color:#2563eb;font-size:16px;">👥</span><span style="font-size:13px;font-weight:700;color:#0f172a;">Add Vendors / Counter Offer</span></div><span style="color:#94a3b8;font-size:18px;font-weight:700;">&rsaquo;</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,0.02);cursor:pointer;"><div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:#eff6ff;color:#2563eb;font-size:16px;">📅</span><span style="font-size:13px;font-weight:700;color:#0f172a;">Extend Timeline</span></div><span style="color:#94a3b8;font-size:18px;font-weight:700;">&rsaquo;</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#ffffff;border:1px solid #3b82f6;border-radius:10px;box-shadow:0 1px 3px rgba(37,99,235,0.08);cursor:pointer;"><div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:#2563eb;color:#ffffff;font-size:16px;">👤</span><span style="font-size:13px;font-weight:700;color:#0f172a;">Add Member</span></div><span style="color:#2563eb;font-size:18px;font-weight:700;">+</span></div></div></div>`;
	},

	getVendorsTableData() {
		return [
			{
				vendorName: 'ABB India Ltd.',
				status: '✓ Responded',
				submissionTime: '03 Jun, 02:15 PM',
				contact: 'bid.team@abb.in',
				bidAmount: '₹ 2,35,000',
				savings: '-12.9%',
				rank: 'L1'
			},
			{
				vendorName: 'Siemens Energy',
				status: '✓ Responded',
				submissionTime: '03 Jun, 03:40 PM',
				contact: 'sales@siemens.com',
				bidAmount: '₹ 2,42,000',
				savings: '-13.5%',
				rank: 'L2'
			},
			{
				vendorName: 'Schneider Electric',
				status: '✓ Responded',
				submissionTime: '03 Jun, 05:20 PM',
				contact: 'tenders@se.com',
				bidAmount: '₹ 2,55,000',
				savings: '-13.5%',
				rank: 'L3'
			},
			{
				vendorName: 'L&T Electrical & Automation',
				status: '✓ Responded',
				submissionTime: '04 Jun, 10:10 AM',
				contact: 'ea.bids@lntebg.com',
				bidAmount: '₹ 2,68,000',
				savings: '-13.5%',
				rank: 'L4'
			},
			{
				vendorName: 'General Electric Grid',
				status: '✓ Responded',
				submissionTime: '04 Jun, 11:45 AM',
				contact: 'grid.solutions@ge.com',
				bidAmount: '₹ 2,85,000',
				savings: '-12.3%',
				rank: 'L5'
			}
		];
	},

	// ============================================================================
	// STANDARDIZED HEADER & TIMER CARD MODELS
	// ============================================================================
		getWhatsAppNotificationLogs() {
		return [
			{
				timestamp: "03 Jun 2026, 02:15 PM",
				vendorName: "ABB India Ltd.",
				mobileNumber: "+91 98201 12345",
				notificationEvent: "RFP Invitation Dispatched",
				messagePreview: "Hello, GMR has invited you to participate in RFQ-2026-000567. Please submit quotes on Ariba.",
				status: "✓✓ Read"
			},
			{
				timestamp: "03 Jun 2026, 03:40 PM",
				vendorName: "Siemens Energy",
				mobileNumber: "+91 98202 23456",
				notificationEvent: "Bid Submission Reminder",
				messagePreview: "Reminder: Sourcing event RFQ-2026-000567 deadline is approaching. Ensure your BAFO quote is uploaded.",
				status: "✓✓ Read"
			},
			{
				timestamp: "03 Jun 2026, 05:20 PM",
				vendorName: "Schneider Electric",
				mobileNumber: "+91 98203 34567",
				notificationEvent: "Clarification Published",
				messagePreview: "New clarification response published for RFQ-2026-000567. Check the event bulletin board.",
				status: "✓ Delivered"
			},
			{
				timestamp: "04 Jun 2026, 10:10 AM",
				vendorName: "L&T Electrical & Automation",
				mobileNumber: "+91 98204 45678",
				notificationEvent: "Bid Received Confirmation",
				messagePreview: "Your revised bid of ₹ 2,68,000 for RFQ-2026-000567 has been successfully logged by GMR Procurement.",
				status: "✓✓ Read"
			},
			{
				timestamp: "04 Jun 2026, 11:45 AM",
				vendorName: "General Electric Grid",
				mobileNumber: "+91 98205 56789",
				notificationEvent: "Event Deadline Alert",
				messagePreview: "Final notice: Sourcing round closes in 2 hours. Please confirm final submission.",
				status: "✓ Delivered"
			}
		];
	},

getHeaderModel() {
		const step = this.getSimStep();
		const isClosed = step >= 8 || this.isHistoricalRound();
		const s = isClosed ? {
			label: 'Event Closed',
			bg: '#dcfce7',
			color: '#15803d',
			dotColor: '#16a34a'
		} : {
			label: 'Bidding in Progress',
			bg: '#eff6ff',
			color: '#1d4ed8',
			dotColor: '#2563eb'
		};
		return {
			phaseBadge: "STAGE 06 - BID MONITORING",
			title: this.getGroupName(),

			status: s,
			showRefresh: true,
			showConversationHistory: true,
			historyButtonLabel: "WhatsApp Notifications" 
		};
	},

	async handleRefresh() {
		showAlert('Refreshing vendor responses and bid timeline...', 'info');
		showAlert('Bid monitoring data is up to date.', 'success');
	},

	getCountdownCardHtml() {
		return `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;width:100%;height:100%;box-sizing:border-box;font-family:Inter,sans-serif;user-select:text;-webkit-user-select:text;cursor:text;"><div style="user-select:text;-webkit-user-select:text;cursor:text;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;user-select:text;-webkit-user-select:text;cursor:text;">TIME REMAINING   </div><div style="font-size:18px;font-weight:900;color:#0f172a;font-family:Inter,monospace;letter-spacing:0.5px;user-select:text;-webkit-user-select:text;cursor:text;">00:28:08   </div></div><div style="width:38px;height:38px;border-radius:8px;background:#fef2f2;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:18px;flex-shrink:0;user-select:none;cursor:default;">⏱</div></div>`;
	}
};
