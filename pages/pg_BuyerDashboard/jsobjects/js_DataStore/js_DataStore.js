export default {
	/**
     * Parses a currency or numeric string into a valid float.
     * Extracted for high reuse across value filters.
     */
	_parseNumeric(value) {
		if (value === null || value === undefined) return 0;
		if (typeof value === "number") return isNaN(value) ? 0 : value;

		const cleaned = String(value).replace(/[^\d.-]/g, "");
		const parsed = parseFloat(cleaned);

		return isNaN(parsed) ? 0 : parsed;
	},

	/**
     * Normalizes an Appsmith/DB date string or timestamp into a JS Date object.
     */
	_parseDate(dateValue) {
		if (!dateValue) return null;
		let val = dateValue;

		if (typeof val === "string" && !isNaN(Number(val))) {
			val = Number(val);
		}

		const d = new Date(val);
		return isNaN(d.getTime()) ? null : d;
	},

	/**
     * Matches a target string against a source status code safely.
     * Abstracted to prevent repetitive null checking and casing issues.
     */
	_matchStatus(source, target) {
		return (source || "").toUpperCase().includes(target.toUpperCase());
	},

	/**
     * Applies Date and Value filters to the provided data array.
     * Extracted to avoid duplicating logic between getFilteredData and getDynamicPlantOptions.
     */
	_applyBaseFilters(data) {
		let filtered = [...data];

		// 1. SAFELY CHECK DATE PICKERS
		const startDate = typeof dt_FilterStartDate !== "undefined" ? dt_FilterStartDate.selectedDate : null;
		const endDate = typeof dt_FilterEndDate !== "undefined" ? dt_FilterEndDate.selectedDate : null;

		if (startDate || endDate) {
			const start = startDate ? new Date(startDate) : new Date("2000-01-01");
			const end = endDate ? new Date(endDate) : new Date("2100-01-01");

			filtered = filtered.filter(row => {
				const rowDate = this._parseDate(row.CREATED_DATE);
				if (!rowDate) return true; // Preserve rows without dates
				return rowDate >= start && rowDate <= end;
			});
		}

		// 2. SAFELY CHECK PR VALUE
		const operator = typeof sel_FilterOperator !== "undefined" ? sel_FilterOperator.selectedOptionValue : null;
		const textVal = typeof inp_FilterValue !== "undefined" ? (inp_FilterValue.text || inp_FilterValue.value) : null;

		if (operator && textVal && String(textVal).trim() !== "") {
			const targetValue = this._parseNumeric(textVal);

			filtered = filtered.filter(row => {
				const numValue = this._parseNumeric(row.REQUISITION_VALUE);

				switch (operator) {
					case ">": return numValue > targetValue;
					case "<": return numValue < targetValue;
					case "=": return numValue === targetValue;
					case ">=": return numValue >= targetValue;
					case "<=": return numValue <= targetValue;
					default: return true;
				}
			});
		}

		return filtered;
	},

	/**
     * Centralized Mock Data for the Demo Showcase.
     * Replaces the SQL query.
     */
	getRawData() {
		const baseData = [
			{
				"PR_ID": "6000062364",
				"REQUISITION_NUMBER": "6000062364",
				"REQUISITION_VALUE": "150000.00",
				"STATUS_CODE": "PR_CONSISTENCY_CHECK",
				"STATUS_NAME": "Consistency Check",
				"CATEGORY": "IT",
				"CREATED_DATE": "1720000000000",
				"CHANGED_ON_DATE": "1720000000000",
				"PLANT_NAME": "DELHI AIRPORT",
				"PLANT_CODE": "DEL1",
				"AGE_DAYS": 5,
				"PRIORITY": "HIGH",
				"HEADER_NOTE": "Server Procurement",
				"TOTAL_LINE_ITEMS": 3,
				"OA_COUNT": 0,
				"ARC_COUNT": 0
			},
			{
				"PR_ID": "6000062365",
				"REQUISITION_NUMBER": "6000062365",
				"REQUISITION_VALUE": "45000.00",
				"STATUS_CODE": "OAARC_CHECK",
				"STATUS_NAME": "OA/ARC Check",
				"CATEGORY": "IT",
				"CREATED_DATE": "1720100000000",
				"CHANGED_ON_DATE": "1720100000000",
				"PLANT_NAME": "HYDERABAD AIRPORT",
				"PLANT_CODE": "HYD1",
				"AGE_DAYS": 2,
				"PRIORITY": "MEDIUM",
				"HEADER_NOTE": "Laptop Procurement",
				"TOTAL_LINE_ITEMS": 1,
				"OA_COUNT": 1,
				"ARC_COUNT": 0
			},
			{
				"PR_ID": "6000062366",
				"REQUISITION_NUMBER": "6000062366",
				"REQUISITION_VALUE": "800000.00",
				"STATUS_CODE": "PR_CONSISTENCY_APPROVED",
				"STATUS_NAME": "RFQ Generation",
				"CATEGORY": "IT",
				"CREATED_DATE": "1720200000000",
				"CHANGED_ON_DATE": "1720200000000",
				"PLANT_NAME": "GOA AIRPORT",
				"PLANT_CODE": "GOA1",
				"AGE_DAYS": 10,
				"PRIORITY": "CRITICAL",
				"HEADER_NOTE": "Network Switch Upgrade",
				"TOTAL_LINE_ITEMS": 5,
				"OA_COUNT": 0,
				"ARC_COUNT": 0
			},
			{
				"PR_ID": "6000062367",
				"REQUISITION_NUMBER": "6000062367",
				"REQUISITION_VALUE": "320000.00",
				"STATUS_CODE": "MANUAL_ROUTE",
				"STATUS_NAME": "Manual Route",
				"CATEGORY": "SERVICES",
				"CREATED_DATE": "1720300000000",
				"CHANGED_ON_DATE": "1720300000000",
				"PLANT_NAME": "DELHI AIRPORT",
				"PLANT_CODE": "DEL1",
				"AGE_DAYS": 3,
				"PRIORITY": "HIGH",
				"HEADER_NOTE": "HVAC Annual Maintenance (Manual Route)",
				"TOTAL_LINE_ITEMS": 2,
				"OA_COUNT": 0,
				"ARC_COUNT": 0
			}
		];

		const overrides = (typeof appsmith !== 'undefined' && appsmith.store && appsmith.store.pr_overrides) || {};
		return baseData.map(row => {
			const id = String(row.PR_ID || row.REQUISITION_NUMBER);
			if (overrides[id]) {
				return { ...row, ...overrides[id] };
			}
			return row;
		});
	},

	/**
     * Main function to retrieve PR data for the dashboard.
     * Applies Date, Value, Entity, and Tile filters sequentially.
     */
	getFilteredData() {
		try {
			let data = this.getRawData();

			// Apply standard Date and Value filters
			data = this._applyBaseFilters(data);

			// 3. SAFELY CHECK ENTITY (Plant Name)
			const selectedEntity = typeof sel_FilterEntity !== "undefined" ? sel_FilterEntity.selectedOptionValue : null;

			if (selectedEntity && selectedEntity.trim() !== "") {
				data = data.filter(row => row.PLANT_NAME === selectedEntity);
			}

			// 4. TILE CLICK FILTERING (Dynamic matching for Dashboard Tiles)
			const tileFilter = appsmith.store.tileFilter;

			if (tileFilter) {
				const filterUpper = tileFilter.toUpperCase();

				data = data.filter(row => {
					const match = (target) => this._matchStatus(row.STATUS_CODE, target);

					switch (filterUpper) {
						case "CONS_VENDOR":
							return match("PR_CONSISTENCY_CHECK") ||
								match("PR_CONSISTENCY_APPROVED") ||
								match("VENDOR_RECOMMENDATION") ||
								match("VENDOR_SELECTION");

						case "OA_ARC_DOCUMENTS":
							return match("OAARC_CHECK");

						case "COMMERCIAL_EVAL":
							return match("COMMERCIAL_RFP") ||
								match("COMMERCIAL_AUCTION");

						case "PO_POSTED":
							return match("PO_RELEASED") ||
								match("PO_POSTED");

						case "MANUAL_ROUTE":
							return match("MANUAL_ROUTE") || (row.STATUS_NAME || '').toUpperCase().includes("MANUAL");

						default:
							return match(filterUpper);
					}
				});
			}

			return data;
		} catch (err) {
			return [{ ERROR: err.message, STACK: err.stack }];
		}
	},

	/**
     * Returns a unique list of Plant Names based on the CURRENT Date and Value filters.
     * Ensures the Entity dropdown only shows plants that exist in the currently filtered dataset.
     */
	getDynamicPlantOptions() {
		let data = this.getRawData();
		if (!data || !Array.isArray(data)) return [];

		// Apply only Date and Value filters so the dropdown reflects available data
		data = this._applyBaseFilters(data);

		return _.uniq(data.map(row => row.PLANT_NAME))
			.filter(code => code != null && code.trim() !== "")
			.map(code => ({ label: code, value: code }));
	}
};