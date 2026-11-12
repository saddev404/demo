export default {
	// ============================================================================
	// 1. Resolve Active PR ID
	// ============================================================================
	getPRId() {
		// Attempt to get the PR data from the Appsmith store.
		const pr = appsmith.store.selected_pr || {};
		// Return the prId, or fallback to the requisition number.
		return pr.prId || pr.requisition || "";
	},

	// ============================================================================
	// 2. Data Provider for Top Summary Tiles
	// ============================================================================
	getLineItemStats() {
		// Fetch raw line items from the SQL query.
		const rawRows = js_MockData.getLineItems() || [];

		// If data isn't loaded yet, return 0s to prevent UI crashing.
		if (!Array.isArray(rawRows)) return { total: 0, oa: 0, arc: 0, none: 0 };

		let oa = 0, arc = 0, none = 0;

		// Iterate through the raw rows to count the contract matches.
		rawRows.forEach(row => {
			if (row.OA_Number && String(row.OA_Number).trim() !== "") {
				oa++; // Found an Outline Agreement
			} else if (row.ARC_Number && String(row.ARC_Number).trim() !== "") {
				arc++; // Found an Annual Rate Contract
			} else {
				none++; // No contract found
			}
		});

		return { total: rawRows.length, oa, arc, none };
	},

	// The following methods simply return formatted strings for the native Appsmith Text Widgets above the table.
	getEvaluatedSummary() {
		const stats = this.getLineItemStats();
		return `${stats.total} / ${stats.total}`;
	},
	getOaSummary() {
		return `${this.getLineItemStats().oa} Found`;
	},
	getArcSummary() {
		return `${this.getLineItemStats().arc} Matched`;
	},
	getRegularSummary() {
		const noneCount = this.getLineItemStats().none;
		return `${noneCount} Item${noneCount !== 1 ? 's' : ''}`;
	},

	// ============================================================================
	// 3. Schema Builder for Universal Table Widget
	// ============================================================================
	getWidgetModel() {
		const rawRows = js_MockData.getLineItems() || [];

		// If data is empty or loading, return an empty schema to prevent widget errors.
		if (!Array.isArray(rawRows)) return { columns: [], data: [], config: {} };

		// Fetch the pre-computed stats to eliminate counting redundancy in the loop below
		const stats = this.getLineItemStats();

		// ------------------------------------------------------------------------
		// JSON/Dictionary Mappings
		// ------------------------------------------------------------------------
		// Dictionary mapping known status strings to their respective CSS classes.
		// Using an object lookup is cleaner, easier to maintain, and O(1) performance compared to if/else.
		const statusClassMap = {
			'SUCCESS': 'cm-status-success',
			'APPROVED': 'cm-status-success',
			'COMPLETED': 'cm-status-success',
			'WARNING': 'cm-status-warning',
			'REVIEW': 'cm-status-warning',
			'PENDING': 'cm-status-warning',
			'ERROR': 'cm-status-purple',
			'REJECTED': 'cm-status-purple',
			'FAILED': 'cm-status-purple'
		};

		// ------------------------------------------------------------------------
		// Construct Generic Data Array
		// ------------------------------------------------------------------------
		// We map over the raw SQL rows and transform them into a generic schema that the widget understands.
		const tableData = rawRows.map((row, index) => {

			// Extract identifiers and format raw values.
			const lineId = row.line_id + '-' + row.material_code;
			const hasOA = !!(row.OA_Number && String(row.OA_Number).trim() !== "");
			const hasARC = !!(row.ARC_Number && String(row.ARC_Number).trim() !== "");
			const formattedQty = `${row.quantity || ''} ${row.uom || ''}`.trim();

			// Derive Pipeline Status CSS and Badge Text
			const s = (row.status || '').toUpperCase();
			const pipelineBadge = s || 'PENDING';
			const pipelineCls = statusClassMap[s] || 'cm-status-gray';

			// Derive the specific contract match UI properties.
			let contractMatchData = [{ text: 'None Matched', color: '#6B7280', bold: true, type: 'text' }, { text: '(RFP Route)', color: '#9CA3AF' }];
			let filterType = 'none';

			if (hasOA) {
				filterType = 'oa';
				contractMatchData = [
					{ text: String(row.OA_Number), color: '#10B981', bold: true, type: 'text' }
				];
			} else if (hasARC) {
				filterType = 'arc';
				contractMatchData = [
					{ text: row.material_description || '', color: '#111827', bold: true },
					{ text: 'Vendor: ' + (row.vendor || row.purchase_group || ''), color: '#4B5563' },
					row.validity_upto ? { text: 'Valid till: ' + row.validity_upto, color: '#D97706' } : null,
					{ text: String(row.ARC_Number), color: '#1E3A8A', bold: true, type: 'text' }
				].filter(Boolean); // Remove nulls
			}

			// ====================================================================
			// DATA ROW OBJECT
			// ====================================================================
			// This object is passed directly to the generic React widget.
			// The keys (like 'prLineDetails') MUST exactly match the 'id' in the columns array below.
			return {
				// Internal hidden IDs used by the widget for selection and filtering.
				_rowId: String(lineId) + '_' + index,
				_filterValue: filterType, // e.g., 'oa', 'arc', or 'none'

				// COLUMN 1: PR Line Details (Type: multi_text)
				prLineDetails: [
					{ text: lineId, color: '#2563EB', bold: true, type: 'number' },
					{text: row.short_text, bold: true || ""},
					{ text: "Qty: " + formattedQty, color: '#4B5563' }
				],

				// COLUMN 2: Matched Contract (Type: multi_text)
				matchedContract: contractMatchData,

				// COLUMN 3: Screened At (Type: date)
				screenedAt: row.changed_on_date || "",

				// COLUMN 4: Pipeline Routing Status (Type: badge)
				pipelineStatus: {
					text: pipelineBadge,
					class: pipelineCls
				}
			};
		});

		// ------------------------------------------------------------------------
		// Construct Dynamic Header Banner
		// ------------------------------------------------------------------------
		// If we found any OAs or ARCs, we want to inject a warning banner into the top of the widget.
		let banner = null;
		if (stats.oa > 0 || stats.arc > 0) {
			banner = {
				show: true,
				icon: "🔒",
				title: "Workflow Locked: Contract Match Found",
				desc: "This PR contains items mapped to an existing Outline Agreement (OA) or Annual Rate Contract (ARC). Standard manual sourcing in the buyer queue is permanently disabled."
			};
		}

		// ========================================================================
		// MASTER SCHEMA PAYLOAD
		// ========================================================================
		// This entire object is bound to the widget via: {{ js_OaArcController.getWidgetModel() }}
		return {

			// 1. COLUMN DEFINITIONS
			// This tells the generic widget exactly how many columns to draw, what to name them,
			// how to render their data (type), and whether to enable sorting/searching on them.
			columns: [
				{ id: "prLineDetails", label: "PR Line Details", type: "multi_text", sortable: true, searchable: true },
				{ id: "matchedContract", label: "Matched Contract (OA / ARC)", type: "multi_text", sortable: true, searchable: true },
				{ id: "screenedAt", label: "Screened At", type: "date", sortable: true, searchable: false, align: "center" },
				{ id: "pipelineStatus", label: "Pipeline Routing Status", type: "badge", sortable: false, searchable: true }
			],

			// 2. THE DATA
			data: tableData,

			// 3. UI CONFIGURATION
			// This controls the external framing of the widget (Title, Toolbar, Dropdowns, Pagination)
			config: {
				title: "Contract Integration & Alignment Matrix",
				subtitle: "Real-time evaluation of PR line items against Outline Agreements (OA) and Annual Rate Contracts (ARC).",
				summaryText: `${stats.oa} OA${stats.oa !== 1 ? 's' : ''} - ${stats.arc} ARC Matched`,

				// Search configuration
				isSearchable: true,
				searchPlaceholder: "Search PR line, item, contract...",

				// Filter Dropdown configuration
				isFilterable: true,
				filterLabel: "Contract",
				// These are the actual options that appear in the dropdown menu.
				// The generic widget iterates over this array to create the HTML <option> tags.
				// When a user selects "OA", the widget filters the rows where `_filterValue === "oa"`.
				filterOptions: [
					{ label: "All", value: "All" },
					{ label: "OA", value: "oa" },
					{ label: "ARC", value: "arc" },
					{ label: "None", value: "none" }
				],

				// Pagination and Empty State configurations
				defaultRowsPerPage: 10,
				headerBanner: banner,
				emptyState: {
					title: "No Contract Evaluation Results Found",
					desc: "Try adjusting your search or filter criteria."
				}
			}
		};
	}
};