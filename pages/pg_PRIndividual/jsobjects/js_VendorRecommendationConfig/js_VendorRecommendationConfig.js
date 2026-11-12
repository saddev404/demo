export default {
	/**
     * getWidgetModel()
     * ------------------------------------------------------------------------
     * Acts as the Smart Controller for the VendorRecommendationHub Custom Widget.
     * It reads the global Appsmith store, local variables, and database queries
     * and compiles them into a single, clean JSON object for the Widget to render.
     */
	getWidgetModel() {
		// 1. Fetch raw data from Appsmith Stores and Queries
		const prValue = Number(appsmith.store.selected_pr?.value || 0);
		const prStatus = appsmith.store.selected_pr?.statusCode || '';

		const rfqGroups = js_MockData.getVendorGroups() || [];
		const rfqPhase = rfqGroups.length > 0 ? rfqGroups[0].STATUS : '';

		// 2. Parse the AI Recommendation JSON from the DB
		let aiBuckets = null;
		try {
			const rawRecommendation = js_MockData.getVendorRecommendations()?.[0]?.raw_vendor_recommendation_json;
			if (rawRecommendation) {
				const dbData = typeof rawRecommendation === 'string'
				? JSON.parse(rawRecommendation)
				: rawRecommendation;

				// Track assigned line item IDs to populate unassigned items if any
				const assignedLineIds = new Set();
				(dbData.groups || []).forEach(g => {
					(g.lineItems || []).forEach(lineId => {
						const targetId = typeof lineId === 'object' && lineId !== null ? (lineId.id || lineId.lineId) : lineId;
						if (targetId !== undefined && targetId !== null) {
							assignedLineIds.add(String(targetId));
						}
					});
				});

				const unassignedItems = (dbData.lineDetail || [])
				.filter(l => {
					const lid = l.lineId !== undefined ? l.lineId : (l.line_id || l.id);
					return !assignedLineIds.has(String(lid));
				})
				.map(item => ({
					id: item.lineId !== undefined ? item.lineId : (item.line_id || item.id),
					name: item.description || item.short_text || item.name || ('Item ' + item.lineId),
					qty: item.qty !== undefined ? item.qty : (item.quantity || 0),
					uom: item.uom || item.unit || ''
				}));

				aiBuckets = {
					buckets: (dbData.groups || []).map(g => ({
						id: g.id,
						name: g.name,
						description: g.description,
						group_type: g.group_type || '',
						lineItems: (g.lineItems || []).map(lineId => {
							const targetId = typeof lineId === 'object' && lineId !== null ? (lineId.id || lineId.lineId) : lineId;
							const item = (dbData.lineDetail || []).find(l => String(l.lineId !== undefined ? l.lineId : (l.line_id || l.id)) === String(targetId));
							return {
								id: item ? (item.lineId !== undefined ? item.lineId : item.id) : targetId,
								name: item ? (item.description || item.short_text || item.name) : ('Line ' + targetId),
								qty: item ? (item.qty !== undefined ? item.qty : (item.quantity || 0)) : 0,
								uom: item ? (item.uom || item.unit || '') : ''
							};
						}),
						recommendedVendors: (g.recommendedVendors || []).map(v => ({
							id: v.vendor_id || v.id,
							name: v.name,
							matchPct: v.composite_score !== undefined ? v.composite_score : (v.matchPct || 0),
							justification: v.justification || '',
							additionalInfo: v.additional_info || v.additionalInfo || '',
							ranking: v.vendor_ranking || v.ranking || 1
						}))
					})),
					unassigned: unassignedItems
				};
			}
		} catch (error) {
			console.error("Failed to parse recommendation_json:", error);
		}

		// Demo Mode: Lock the UI only if the user has progressed past this stage
		let footerState = 'EDITABLE';
		if (appsmith.store.demo_native_stage === 'rfp_generation') {
			footerState = 'GENERATED';
		}
		const isLocked = footerState !== 'EDITABLE';

		// 5. Construct the final model payload for the React Widget
		return {
			aiBuckets: aiBuckets,
			isLocked: isLocked,
			footerState: footerState,
			sessionActionState: js_RFQGroupController.sessionState,

			// Feature Flags for customization
			allowCustomVendor: !isLocked,
			allowCustomGroup: !isLocked
		};
	}
};