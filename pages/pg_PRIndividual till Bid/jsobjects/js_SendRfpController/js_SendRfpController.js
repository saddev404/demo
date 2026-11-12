export default {
	// ============================================================================
	// 1. MULTI-RFQ GROUP MANAGEMENT
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

	getGroupSelectOptions() {
		const allGroups = js_MockData.getVendorGroups() || [];
		return allGroups.map(g => ({
			label: `${g.GROUP_NAME} (Round ${g.activeRound || 1})`,
			value: g.RFQ_GROUP_ID
		}));
	},

	async handleGroupChange(groupId) {
		const allGroups = js_MockData.getVendorGroups() || [];
		const targetGroup = allGroups.find(g => String(g.RFQ_GROUP_ID) === String(groupId));
		if (!targetGroup) return;

		let parsedJson = {};
		try {
			if (targetGroup.RFQ_DATA_JSON) {
				parsedJson = typeof targetGroup.RFQ_DATA_JSON === 'string'
					? JSON.parse(targetGroup.RFQ_DATA_JSON)
				: targetGroup.RFQ_DATA_JSON;
			}
		} catch (e) {
			console.error("Failed to parse RFQ_DATA_JSON", e);
		}

		const activeR = targetGroup.activeRound || 1;
		await storeValue("selected_vendor_group", {
			...targetGroup,
			parsedRfqData: parsedJson
		});
		await storeValue("active_sourcing_round", activeR);
		await storeValue("viewing_sourcing_round", activeR);

		showAlert(`Switched to RFQ Group: ${targetGroup.GROUP_NAME}`, 'info');
	},

	// ============================================================================
	// 2. MULTI-ROUND DERIVATIONS
	// ============================================================================
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

	// ============================================================================
	// 3. STEPPER & SIMULATION ENGINE
	// ============================================================================
	isRfpCreated() {
		if (this.isHistoricalRound()) return true;
		const grpId = this.getSelectedGroupId();
		const storeKey = grpId === 2 ? 'rfp_created_g2' : 'rfp_created';
		return Boolean(appsmith.store[storeKey]);
	},

	async proceedAndCreateRfp() {
		const grpId = this.getSelectedGroupId();
		const storeKey = grpId === 2 ? 'rfp_created_g2' : 'rfp_created';
		const stepKey = grpId === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		await storeValue(storeKey, true);
		await storeValue(stepKey, 5);
		showAlert('Vendor contact details verified. RFP Draft created successfully in SAP Ariba!', 'success');
	},

	async saveVendorContact(name, email, mobile) {
		if (!name || !email || !mobile) {
			showAlert('All vendor contact fields are required.', 'warning');
			return;
		}
		await storeValue('vendor_contact_person', name);
		await storeValue('vendor_contact_email', email);
		await storeValue('vendor_contact_mobile', mobile);
		closeModal('mdl_EditVendorContact');
		showAlert('Vendor contact details saved successfully!', 'success');
	},

	currentStep() {
		if (this.isHistoricalRound()) {
			return 6;
		}
		const grpId = this.getSelectedGroupId();
		const storeKey = grpId === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		// Default to Step 5 (Draft Ready) to match user design screenshot out of the box
		return appsmith.store[storeKey] || 5;
	},

	async simulateNextStep() {
		if (!this.isRfpCreated()) {
			// Pre-creation gate: RFP draft has not been created yet. Do not advance simulation or display status popups.
			return;
		}
		if (this.isHistoricalRound()) {
			showAlert(`Viewing historical archive for Round ${this.getViewingRound()}. Click 'Return to Active Round' to simulate.`, 'info');
			return;
		}
		const grpId = this.getSelectedGroupId();
		const storeKey = grpId === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		const cur = this.currentStep();
		const next = cur >= 6 ? 1 : cur + 1;
		await storeValue(storeKey, next);

		const stepNames = {
			1: 'Queued',
			2: 'SAP Processing',
			3: 'RFP Generating',
			4: 'Ariba Syncing',
			5: 'Completed (Draft Created)',
			6: 'Published & Live'
		};
		showAlert(`Simulated Status: ${stepNames[next]}`, 'info');
	},

	async reviewAndApproveDraft() {
		const grpId = this.getSelectedGroupId();
		const storeKey = grpId === 2 ? 'rfp_sim_step_g2' : 'rfp_sim_step';
		await storeValue(storeKey, 6);
		showAlert('Draft Approved! RFP Successfully Published & Dispatched to suppliers on SAP Ariba.', 'success');
	},

	isReviewAndApproveVisible() {
		if (!this.isRfpCreated()) return false;
		return this.currentStep() === 5;
	},

	isReviewAndApproveDisabled() {
		return this.currentStep() !== 5;
	},

	isNextDisabled() {
		return this.currentStep() < 6;
	},

	async proceedToNextStage() {
		if (this.isHistoricalRound()) {
			showAlert('Cannot proceed from historical archive. Please return to the active round.', 'warning');
			return;
		}
		if (this.isNextDisabled()) {
			showAlert('Please review and approve the draft before proceeding to Bid Monitoring.', 'warning');
			return;
		}

		const grpId = this.getSelectedGroupId();
		const groupStages = appsmith.store.rfq_group_stages || {};
		groupStages[grpId] = 'bid_monitoring';
		await storeValue("rfq_group_stages", groupStages);

		const bidSimKey = Number(grpId) === 2 ? 'bid_mon_sim_step_g2' : 'bid_mon_sim_step';
		if (!appsmith.store[bidSimKey]) {
			await storeValue(bidSimKey, 7);
		}

		await storeValue("viewing_stage_id", "bid_monitoring");
		await js_NavigationController.handleStageSelect("bid_monitoring");
		showAlert('RFP Published! Navigated to Bid Monitoring (Stage 06).', 'success');
	},

	// ============================================================================
	// 4. HEADER STATUS PILL (Auto-width, right-aligned, non-wrapping)
	// ============================================================================
	getHeaderStatusHtml() {
		const step = this.currentStep();
		const statusMap = {
			1: { label: 'Queued', bg: '#f1f5f9', color: '#475569', icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#64748b;margin-right:2px;"></span>' },
			2: { label: 'SAP Processing', bg: '#eff6ff', color: '#1d4ed8', icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2563eb;margin-right:2px;"></span>' },
			3: { label: 'RFP Generating', bg: '#eff6ff', color: '#1d4ed8', icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2563eb;margin-right:2px;"></span>' },
			4: { label: 'Ariba Syncing', bg: '#eff6ff', color: '#1d4ed8', icon: '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2563eb;margin-right:2px;"></span>' },
			5: { label: 'Completed (Draft Created)', bg: '#dcfce7', color: '#15803d', icon: '<span style="font-weight:900;font-size:12px;line-height:1;margin-right:2px;">&#10003;</span>' },
			6: { label: 'Published & Live', bg: '#dcfce7', color: '#15803d', icon: '<span style="font-weight:900;font-size:12px;line-height:1;margin-right:2px;">&#10003;</span>' }
		};
		const s = !this.isRfpCreated() ? { label: "Pending Vendor Verification", bg: "#fef3c7", color: "#b45309", dotColor: "#d97706" } : (statusMap[step] || statusMap[5]);
		return `<div style="width:100%;height:100%;display:flex;justify-content:flex-end;align-items:center;background:transparent;border:none;box-sizing:border-box;"><div style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:4px 12px;white-space:nowrap;width:max-content;max-width:max-content;flex-shrink:0;box-sizing:border-box;"><span style="color:#64748b;font-weight:500;font-size:12px;font-family:Inter,sans-serif;">Status:</span><span style="display:inline-flex;align-items:center;gap:4px;background:${s.bg};color:${s.color};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;font-family:Inter,sans-serif;">${s.icon}${s.label}</span></div></div>`;
	},

	getStepIcon(step) {
		const icons = {
			1: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAB70lEQVR4nO1Zwa3DIAxljRyyS3vqseo9p8zSCaKs0Qk6RS7pAqnUEXJ7/1dyJGSZFDAp5f8ivUuLwS88GwMGgCkZ2R34EsjtwJdAwsEqAA2ADsAVwAhgIoz0W0d9qk8i0JBzoe1KttkINPRltW3UEImVysXDsRnAgzB79L/ESCvU+T1pWmpPR3sAJwC1YFvTfz31ldpEc2xC4OiY9AagjVjJlmyldkxNYO+Y6KyIoQVnx9heK+GreS6bmeSgdX7BSYiTyScmfAbnAfucaOdhd/h1bCAcPPrvBBIXLYFGWFrfLz9YNkPASvC2mmJfDcjzfIjm75bdPcCOx8QYS4B//VugrmMJGCE7OVdhbRBeHoSmSg2Bls19DSVQsQEegQ5oCRhhsxMzkq98+gwEeh8ZuYw7ZhyT87UEeEbqQghw/Uu1zdYEap84cBnb6XOOmFwi4MLaRmdvbGI6dU1ulw4xAcwJvGqujc4O5OndBAbB0bcRSCGhpRZak89mEkoRxFqogjhFGtVClUZTbGRaqDayFKWEFqpSwiQo5jRQF3OSjELLaQ2SlNNGeaCJRbIDjbQK2DgjJT9SGsWhPhSbHOrNX7hWMaVfbC0o+mrRXoliL3cXFH29bqPYBw6JSJFPTJK0inzky4rsDnwJ5Hbg3xP4AaXVxuNxuPWRAAAAAElFTkSuQmCC',
			2: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABt0lEQVR4nO2YsUoEMRCGF9TCeh/B8hrxAcT1NazsDhabK1XkWCws1Ac5sfBA23sAsdonkEMR6ysPfg3MQojJXZJ1k50jA39zu5n832U2TJIByDgruoEEENtAAohtIAHENtA3gGMAFYApgBrAnFTTbxW90yuAnIwJo7YxpzF5bIARgIWDcTUWlCM4QE4lsSqWAL5IyzXvTn1Xw8f8HtW0LmYASgADzbgBPZsZxtaUu1OA3GBemCoc8hQGkNp1JVwBdGUzblHDY0M5dQIw0kxWtjDfqNTktf6wXUpH3W3a/PPrVkLM9anRI4AdH4BKU/P/Zb6R6eNW48IH4E1J4vLB2qqwBDj3AbiTErx0YF7oSDH6odEDgG0fAKFTAGcAtgIB3NqM68JILwF2ATxRW3DNEeBKSb7PDeBeSX7YAcDBqt2GA0AmnSv+7DZcAJzVR4AhgBNfgGa3+dYoBMCzNMeND4C625giRCvx6gNwaQkQopmrfABEmzD5bRveNQrdTludzFwmYX2gacT6SJltwqE+436tIq8E24stWWyvFtXVYHu5q4rl9XpURTeQAGIbSACxDSSA2Aba6gc0gEk67xjQfwAAAABJRU5ErkJggg==',
			3: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA20lEQVR4nO3YQQ7EIAgFUE/U63sJT+FFaCaZ5TgN8AFNvwm7Bn2ptEoTkXZylC8gE3CJSBeR4Yz+zZUO+EyMGhOF0Dw8gAAYwgqwbh84wgPQTrZ6gy5EFWCiEFWAgUJUAi4EohLQEIhqgBuxA8CF2AVgRlQCVqFCVAG0o+8A8BwGl/NlAizH8a0A3pohgAACCPidMKpbkQZAdis6AW/cQscXMQEEOBNai/ipS33EZ3R50yLgTVsoKggggAAC/ifMiDBA9oAAkDcv7YA0d1E3L+gfO7oQw6N8Ad64ASxibZB0UQEHAAAAAElFTkSuQmCC',
			4: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAB1UlEQVR4nO2YzY2DMBCFES0kNaQMjmkBcdsiKCRInGmBA4dQQqrgllwo4u0ieSVr5F/Gjo2EpZGiGNvvG94YQwGgOHIkF3ACpBZwAqQWcAKkFpAjwAXAD4AewCiiF/9dcga4CKG21ocECSX+DuDtIP6/vcWYLADuGpELgKeIRXMNGyKEbWjmN8GV4tpK9NE7wbLTnkElgBpAJwpUbg+H8Q8yZviri+u3AFoAq8YOT4956J0YYgOUimzTprKNLqpvA6jEf6Tfy47F5cLuYwK0CuENgfKxj8pGYyyAknh+E38TfQPTAtzxTgA1yX4j9V3Fwnt3Ee54J4COZH/XIjHDdoHs8zm12CMBzK4FnquF5C264wCYijhWNGTNmgNg2kZjxI1kfxUadgMUhgdZjMx/yFqtbZzr5LqjxFZsEzNmhXBr8foCuBzmQrbRZh1fANlOuuN0iLa62IYDUCheaLgWGsVctWvWuQC6MB3OtrPOS+p/cc4/sQAmSeBkEB8UIjaATnwwiNgAg0G8zm7ZAtAaOASA/NJC+9kvMyEAfATqipwV3Al8LJI9gK1IswTw2SazBDBB0D0+WwAVhOoBFeQ7UCyAwuE7T5DvQDEBkkRyASdAagHc+AVCrWSDLgB+/QAAAABJRU5ErkJggg==',
			5: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABNklEQVR4nO3aQQ6DIBAFULa9TBOP43G8TW/gJVx4Bk/R3W+a0MRSoeB8mDFhktkZ4Wm/YFsHwF251SfQEnAHMANYhD37czUHvAdm1cZClBy8EAE0xFnA2Y8PHSEBlA4Wu4MihBZgYyG0AAsLoQm4MxCaAMdAaAPECAsAEcIK4DRCExDrIoQWoLRmCwDJZjA6XkvAme24KYA0Mx3QAR1gCPB5IqVe8M0CbgDW3blii5RZwAPfdSnAFEz+CWC4CmDEb43S8RiAnEAO/mrva2JcMAZgv0k72vqGoYXPAeWOswFHiDC0q0eZAaTepEpCqwZIIcJKhVYVEEPs619o1QEpRE5oTQCOELmhNQNwmWuDaQCjO6ADOqAyoEVXA7QuCoD5Q3dpUb7cZf3VoLSTi2HtIFZv9QlI+wUwqEVHHqb4UwAAAABJRU5ErkJggg==',
			6: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAB7klEQVR4nO1ZS46DMAyNuu2Wm7DoWaqu2FXsu+pZegKkHoMT9BRdwQHQm6lkJGTZmQQHmMxgyRs+9nvJsxOCA+By9s0B7AS2BrATSBisBHAD0AB4AegADOQdXWvomfK3EDgSoA+4WHvRu8etCNxoZK3WUazVCHymv00AnFs7R1qx4C+kac2eAGoAJwAFgAN5QddqekazgXIsQuCqJO0B3AlkaKyC3umVmNfUBC5KokckcInIQ4kdNBOhmpdkUxuAc68VOf1YEyHBpYI9JwQ/+lnI01oJ3BYe+ZCZ8LZYX7Cj0OcfC4IfnddE51vsYka/NxZsqBdCd1JnwReIbw/uiYFW35J5k1fs3p3lfsUSKAUtphz9isV+C7PATexIofJ5LgheIuCEFVuUkZakYS+n6jwSeAgSckJHamIIcP2fVgbvKOfUxDrQkvH2qenfV4gW8FIddDEE+NbhoDz3DgA0B7yjnFMb1iDAgc0FbyYQIyENoAW8WUIxRawBtYA3F3FsGw0hEQPeWdvonIXMRyIWvLMuZHO3EhKJOeDNWwmpDkI3c6Frg8/NmzlJRtltp7P/oJFmATl9Uo6e9Ue9+wvHKi73g63Rsz5anM5Etoe705rI9nh96tn+4Jh61r+YJGll95Nvc98cwE5gawD/nsAXA8bzUFHLWNYAAAAASUVORK5CYII='
		};
		return icons[step] || icons[5];
	},

	// ============================================================================
	// 5. ALERT BANNER MODEL (Dynamic Stage-Aware Icons & Colors)
	// ============================================================================
	getAlertBanner() {
		const step = this.currentStep();
		const eventId = this.getKeyDetails().eventId || 'WS-49201';
		switch (step) {
			case 1:
				return {
					bg: '#f8fafc', border: '#e2e8f0',
					iconBg: '#475569',
					title: 'Request Submitted Successfully',
					subtitle: 'The RFP creation request is queued. Waiting for Automation Anywhere bot to process.'
				};
			case 2:
				return {
					bg: '#eff6ff', border: '#bfdbfe',
					iconBg: '#2563eb',
					title: 'SAP Processing in Progress',
					subtitle: 'Validating line items, account assignment, and creating RFQ document in SAP ERP.'
				};
			case 3:
				return {
					bg: '#eff6ff', border: '#bfdbfe',
					iconBg: '#2563eb',
					title: 'RFQ Created in SAP Successfully',
					subtitle: 'SAP RFQ document generated in ERP. Preparing payload for SAP Ariba Sourcing.'
				};
			case 4:
				return {
					bg: '#eff6ff', border: '#bfdbfe',
					iconBg: '#2563eb',
					title: 'Ariba Network Synchronizing',
					subtitle: 'Transferring procurement payload and invited suppliers to SAP Ariba Sourcing middleware.'
				};
			case 5:
				return {
					bg: '#eff6ff', border: '#bfdbfe',
					iconBg: '#2563eb',
					title: 'Ariba Sourcing Draft Created · Ready for Buyer Approval',
					subtitle: `Draft sourcing event ${eventId} has been successfully prepared on SAP Ariba. Please review specifications and approve for dispatch.`
				};
			case 6:
			default:
				return {
					bg: '#ecfdf5', border: '#a7f3d0',
					iconBg: '#059669',
					title: 'RFP Successfully Published & Dispatched',
					subtitle: 'Sourcing event published directly and invitations dispatched to invited suppliers via SAP Ariba.'
				};
		}
	},

	getAlertContentHtml() {
		if (!this.isRfpCreated()) return "";
		const banner = this.getAlertBanner();
		const step = this.currentStep();
		const iconBase64 = this.getStepIcon(step);
		const iconPng = `data:image/png;base64,${iconBase64}`;
		const iconBg = banner.iconBg || '#2563eb';
		return `<div style="display:flex;align-items:center;gap:14px;font-family:Inter,sans-serif;text-align:left;padding:6px 4px;cursor:text;user-select:text;-webkit-user-select:text;"><span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:8px;background:${iconBg};color:#ffffff;flex-shrink:0;user-select:none;box-shadow:0 1px 2px rgba(0,0,0,0.15);"><img src="${iconPng}" width="22" height="22" style="display:block;width:22px;height:22px;pointer-events:none;" alt="" /></span><div style="cursor:text;user-select:text;-webkit-user-select:text;"><div style="font-weight:700;font-size:14px;color:#0f172a;line-height:20px;margin-bottom:2px;cursor:text;user-select:text;-webkit-user-select:text;">${banner.title}</div><div style="font-size:12px;color:#475569;line-height:16px;cursor:text;user-select:text;-webkit-user-select:text;">${banner.subtitle}</div></div></div>`;
	},

	// ============================================================================
	// 6. UNIFIED 4-COLUMN KEY DETAILS BAR (Matching Screenshot)
	// ============================================================================
	getKeyDetails() {
		const grpId = this.getSelectedGroupId();
		const rfqNumber = grpId === 2 ? 'RFQ-2026-000868' : 'RFQ-2026-000867';
		const eventId = grpId === 2 ? 'WS-49202' : 'WS-49201';
		return {
			rfqNumber,
			createdOn: '28 May - 10:52 AM',
			eventId,
			eventType: 'RFP Sourcing'
		};
	},

	getKeyDetailsHtml() {
		const d = this.getKeyDetails();
		return `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;height:100%;font-family:Inter,sans-serif;padding:12px 16px;cursor:text;user-select:text;-webkit-user-select:text;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 1px 3px 0 rgba(0,0,0,0.04);"><div style="flex:1;text-align:left;padding:0 12px;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">RFQ NUMBER</div><div style="font-size:14px;font-weight:700;color:#0f172a;font-family:Inter,sans-serif;">${d.rfqNumber}</div></div><div style="width:1px;height:32px;background:#e2e8f0;flex-shrink:0;"></div><div style="flex:1;text-align:left;padding:0 16px;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">CREATED ON</div><div style="font-size:13px;font-weight:600;color:#334155;font-family:Inter,sans-serif;">${d.createdOn}</div></div><div style="width:1px;height:32px;background:#e2e8f0;flex-shrink:0;"></div><div style="flex:1;text-align:left;padding:0 16px;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">EVENT ID</div><div style="font-size:14px;font-weight:700;color:#0f172a;font-family:Inter,sans-serif;">${d.eventId}</div></div><div style="width:1px;height:32px;background:#e2e8f0;flex-shrink:0;"></div><div style="flex:1;text-align:left;padding:0 16px;"><div style="font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">EVENT TYPE</div><div style="font-size:13px;font-weight:600;color:#334155;font-family:Inter,sans-serif;">${d.eventType}</div></div></div>`;
	},

	// Backwards compatibility helpers
	getSapDetails() {
		const d = this.getKeyDetails();
		return { rfqNumber: d.rfqNumber, createdOn: d.createdOn, status: 'Linked to Ariba', statusColor: '#10b981', footer: 'SAP-Ariba bi-directional link verified' };
	},

	getAribaDetails() {
		const d = this.getKeyDetails();
		return { eventId: d.eventId, eventType: d.eventType, status: 'Draft Created', statusColor: '#10b981', footer: 'Draft sourcing event ready for buyer review' };
	},

	// ============================================================================
	// 7. STANDARDIZED HEADER MODEL (For StandardStageHeader Custom Widget)
	// ============================================================================
	getHeaderModel() {
		const step = this.currentStep();
		const keyDetails = this.getKeyDetails();
		const statusMap = {
			1: { label: 'Queued', bg: '#f1f5f9', color: '#475569', dotColor: '#64748b' },
			2: { label: 'SAP Processing', bg: '#eff6ff', color: '#1d4ed8', dotColor: '#2563eb' },
			3: { label: 'RFP Generating', bg: '#eff6ff', color: '#1d4ed8', dotColor: '#2563eb' },
			4: { label: 'Ariba Syncing', bg: '#eff6ff', color: '#1d4ed8', dotColor: '#2563eb' },
			5: { label: 'Draft Created', bg: '#dcfce7', color: '#15803d', dotColor: '#16a34a' },
			6: { label: 'Published & Live', bg: '#dcfce7', color: '#15803d', dotColor: '#16a34a' }
		};
		const s = !this.isRfpCreated() ? { label: "Pending Vendor Verification", bg: "#fef3c7", color: "#b45309", dotColor: "#d97706" } : (statusMap[step] || statusMap[5]);
		return {
			phaseBadge: "STAGE 05 - RFP CREATION",
			title: this.getGroupName(),

			status: s,
			showRefresh: true,
			showConversationHistory: false
		};
	},

	async handleRefresh() {
		showAlert('Refreshing RFP status and Ariba synchronization...', 'info');
		// Reactive refresh
		showAlert('RFP data is up to date.', 'success');
	}
};
