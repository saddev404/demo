export default {
	/**
     * Centralized status badge styling configuration.
     * Add new statuses here and all widgets automatically inherit the change.
     */
	_BADGE_CONFIG: {
		OAARC_CHECK: { bg: "#fef3c7", text: "#b45309" }, // Amber
		PR_CONSISTENCY_CHECK: { bg: "#e0e7ff", text: "#4338ca" }, // Indigo
		PR_CONSISTENCY_APPROVED: { bg: "#ecfdf5", text: "#059669" },
		PR_REJECTED: { bg: "#fef2f2", text: "#dc2626" },
		CLASS_OVERRIDDEN: { bg: "#faf5ff", text: "#9333ea" },
		ALLOC_DONE: { bg: "#fee2e2", text: "#ef4444" },
		VENDOR_RECOMMENDATION: { bg: "#fffbeb", text: "#d97706" },
		VENDOR_SELECTION: { bg: "#e0f2fe", text: "#0284c7" },
		MANUAL_ROUTE: { bg: "#fef2f2", text: "#b91c1c" }
	},

	_DEFAULT_BADGE: {
		bg: "#f3f4f6",
		text: "#4b5563"
	},

	/**
     * Returns filtered dashboard data safely.
     */
	_getFilteredData() {
		return js_DataStore.getFilteredData() || [];
	},

	/**
     * Converts currency formatted strings into numbers.
     * Example: "$1,234.50" => 1234.50
     */
	_parseNumericValue(value) {
		if (value === null || value === undefined) return 0;

		if (typeof value === "number") {
			return isNaN(value) ? 0 : value;
		}

		const cleaned = String(value).replace(/[^\d.-]/g, "");
		const parsed = parseFloat(cleaned);

		return isNaN(parsed) ? 0 : parsed;
	},

	/**
     * Returns badge styling for the supplied status code.
     */
	_getBadge(statusCode = "") {
		return (
			this._BADGE_CONFIG[statusCode.toUpperCase()] ||
			this._DEFAULT_BADGE
		);
	},

	/**
     * Removes workflow prefixes.
     * Example:
     * "[STEP 1] Vendor Selection" => "Vendor Selection"
     */
	_cleanStatus(statusName) {
		return statusName
			? String(statusName).replace(/^\[.*?\]\s*/, "").trim()
		: "";
	},

	/**
     * Converts numeric string timestamps to Number.
     */
	_normalizeDate(dateValue) {
		return (
			typeof dateValue === "string" &&
			dateValue.trim() !== "" &&
			!isNaN(dateValue)
		)
			? Number(dateValue)
		: dateValue;
	},

	/**
     * Counts records matching a given status code.
     */
	_countByStatus(data, statusFilter) {
		const filterUpper = statusFilter.toUpperCase();

		return data.filter(
			pr =>
			pr.STATUS_CODE &&
			pr.STATUS_CODE.toUpperCase().includes(filterUpper)
		).length;
	},

	/**
     * Adapter Pattern:
     * Standardizes DB fields for application-wide use.
     */
	_standardizePR(row = {}) {
		return {
			...row,
			prId: row.PR_ID || "",
			requisition: row.REQUISITION_NUMBER || "",
			value: this._parseNumericValue(row.REQUISITION_VALUE),
			statusCode: row.STATUS_CODE || "",
			statusName: row.STATUS_NAME || "",
			category: row.CATEGORY || "",
			createdDate: row.CREATED_DATE || "",
			oaCount: row.OA_COUNT || 0,
			arcCount: row.ARC_COUNT || 0,
			plantNameCode: (row.PLANT_NAME || "") + " (" + (row.PLANT_CODE || "") + ")"
		};
	},

	/**
     * Category Summary Table Model
     */
	getCategorySummaryModel() {
		const formattedData = this._getFilteredData().map(row => {
			const stdRow = this._standardizePR(row);
			const badge = this._getBadge(stdRow.statusCode);

			const isAllocDone = String(stdRow.statusCode || "").toUpperCase() === "ALLOC_DONE";

			return {
				...stdRow,
				_requisition_type: isAllocDone ? "text" : "link",
				_requisition_tooltip: isAllocDone ? "Workflow Exception ⚠️, \n Buyer allocation completed but no downstream review process was initiated. \n Please contact Support team." : undefined,
				_statusClean: this._cleanStatus(stdRow.statusName),
				_badgeBg: badge.bg,
				_badgeText: badge.text,
				_createdDate: this._normalizeDate(stdRow.createdDate),
				_changedDate: this._normalizeDate(stdRow.CHANGED_ON_DATE)
			};
		});

		return {
			title: "Purchase Requisitions",
			defaultPageSize: 10,

			columns: [
				{
					key: "requisition",
					label: "PR No",
					type: "link",
					sortable: true,
					searchable: true
				},
				{
					key: "HEADER_NOTE",
					label: "Header Text",
					type: "text",
					sortable: true,
					searchable: true,
					showTooltip: true,
					truncateLength: 50
				},
				{
					key: "value",
					label: "Value",
					type: "currency",
					sortable: true
				},
				{
					key: "_statusClean",
					label: "Status",
					type: "badge",
					sortable: true,
					searchable: true
				},
				{
					key: "_changedDate",
					label: "Changed on Date",
					type: "date",
					sortable: true
				},
				{
					key: "plantNameCode",
					label: "Plant Name",
					type: "text",
					sortable: true,
					searchable: true
				},
				{
					key: "PRIORITY",
					label: "Priority",
					type: "text",
					sortable: true,
					searchable: true
				},
				{
					key: "AGE_DAYS",
					label: "Age (Days)",
					type: "text",
					sortable: true
				},
				{
					key: "ALLOCATION_DATE",
					label: "Allocation Date",
					type: "date",
					sortable: true
				},
				{
					key: "ALLOCATED_BY",
					label: "Allocated by",
					type: "text",
					sortable: false}
				// },
				// {
				// key: "_createdDate",
				// label: "PR Date",
				// type: "date",
				// sortable: true
				// }
			],

			data: formattedData
		};
	},

	/**
     * PR Review Queue Widget Model
     */
	getPRReviewQueueListModel() {
		const priorityData = this._getFilteredData()
		.sort((a, b) => (b.AGE_DAYS || 0) - (a.AGE_DAYS || 0))
		.slice(0, 50);

		return {
			data: priorityData.map(row => {
				const stdRow = this._standardizePR(row);
				const badge = this._getBadge(stdRow.statusCode);

				return {
					...stdRow,

					_feedTitle:
					stdRow.REQUISITION_NUMBER || stdRow.requisition || "N/A",

					_feedSubtitle:
					stdRow.HEADER_NOTE ||
					"No description available",

					_feedBadge:
					stdRow.STATUS_NAME ||
					stdRow.statusName ||
					"UNKNOWN",

					_feedBadgeBg: badge.bg,
					_feedBadgeText: badge.text,

					_feedAge: stdRow.AGE_DAYS || 0,

					_feedCount: stdRow.TOTAL_LINE_ITEMS || null
				};
			})
		};
	},

	/**
     * Dashboard Tile Model
     */
	getDashboardTilesModel() {
		const allData = this._getFilteredData();

		const defaultTile = {
			BgColor: "#ffffff",
			TextColor: "#1e293b",
			Icon: ""
		};

		const counts = {
			manualRoute: allData.filter(r =>
				(r.STATUS_CODE || '').toUpperCase().includes("MANUAL") ||
				(r.STATUS_NAME || '').toUpperCase().includes("MANUAL")
			).length,

			consVendor:
			this._countByStatus(allData, "PR_CONSISTENCY_CHECK") +
			this._countByStatus(allData, "PR_CONSISTENCY_APPROVED") +
			this._countByStatus(allData, "VENDOR_RECOMMENDATION") +
			this._countByStatus(allData, "VENDOR_SELECTION"),

			oaArc: this._countByStatus(allData, "OAARC_CHECK"),

			rfqIssued: this._countByStatus(
				allData,
				"RFQ_TO_BE_ISSUED"
			),

			bidSub: this._countByStatus(
				allData,
				"BID_SUBMISSION"
			),

			techEval: this._countByStatus(
				allData,
				"TECHNICAL_EVAL"
			),

			commRfp: this._countByStatus(
				allData,
				"COMMERCIAL_RFP"
			),

			commAuction: this._countByStatus(
				allData,
				"COMMERCIAL_AUCTION"
			),

			eNfa: this._countByStatus(
				allData,
				"E_NFA"
			),

			poCreated: this._countByStatus(
				allData,
				"PO_CREATED"
			),

			poPosted:
			this._countByStatus(
				allData,
				"PO_RELEASED"
			) +
			this._countByStatus(
				allData,
				"PO_POSTED"
			)
		};

		return {
			layout: {
				columns: 4,
				gap: "20px"
			},

			selectedFilter:
			appsmith.store.tileFilter || "",

			totalPRs:
			(js_DataStore.getRawData.data || allData)
			.length,

			errorCount:
			this._countByStatus(allData, "ALLOC_DONE") +
			this._countByStatus(allData, "PR_SAP_REJECTION_ERROR"),

			rejectedPRs:
			this._countByStatus(allData, "PR_REJECTED") +
			this._countByStatus(allData, "PR_SAP_REJECTED"),

			tiles: [
				{
					...defaultTile,
					TileName: "OA/ARC",
					TileCount: counts.oaArc,
					FilterValue: "OA_ARC_DOCUMENTS",
					SortOrder: 1
				},

				{
					...defaultTile,
					TileName: "Consistency & Vendor",
					TileCount: counts.consVendor,
					FilterValue: "CONS_VENDOR",
					SortOrder: 2
				},

				{
					...defaultTile,
					TileName: "RFQs to Be Issued",
					TileCount: counts.rfqIssued,
					FilterValue: "RFQ_TO_BE_ISSUED",
					SortOrder: 3
				},

				{
					...defaultTile,
					TileName: "Bid Submission",
					TileCount: counts.bidSub,
					FilterValue: "BID_SUBMISSION",
					SortOrder: 4
				},

				{
					...defaultTile,
					TileName: "Technical Evaluation",
					TileCount: counts.techEval,
					FilterValue: "TECHNICAL_EVAL",
					SortOrder: 5
				},

				{
					...defaultTile,
					TileName: "COMMERCIAL EVALUATION",
					TileCount: counts.commRfp + counts.commAuction,
					FilterValue: "COMMERCIAL_EVAL",
					SortOrder: 6,

					SubTiles: [
						{
							TileName: "RFP 2",
							TileCount: counts.commRfp,
							FilterValue: "COMMERCIAL_RFP"
						},
						{
							TileName: "Auction",
							TileCount: counts.commAuction,
							FilterValue: "COMMERCIAL_AUCTION"
						}
					]
				},

				{
					...defaultTile,
					TileName: "e-NFA",
					TileCount: counts.eNfa,
					FilterValue: "E_NFA",
					SortOrder: 7
				},

				{
					...defaultTile,
					TileName: "POs Created",
					TileCount: counts.poCreated,
					FilterValue: "PO_CREATED",
					SortOrder: 8
				},

				{
					...defaultTile,
					TileName: "POs Released",
					TileCount: counts.poPosted,
					FilterValue: "PO_POSTED",
					SortOrder: 9
				},

				{
					...defaultTile,
					TileName: "Manual Route",
					TileCount: counts.manualRoute,
					FilterValue: "MANUAL_ROUTE",
					SortOrder: 10
				}
			]
		};
	}
};