export default {
	getLineItems: () => {
		return [
			{
				line_id: "10",
				slno: 1,
				pr_id: "PR20260041",
				line_number: "10",
				uom: "AU",
				purchase_group: "ECR",
				quantity: 1,
				OA_Number: null,
				ARC_Number: null,
				short_text: "AMC of AVR Unitrol 5000/6000",
				status: null,
				unit_price: 150000.00,
				material_code: "IT001",
				changed_on_date: "24-02-2026",
				vendor: null,
				validity_upto: null,
				material_description: "Laptop Dell XPS 15",
				arcolumndata: "10--1.000",
				arc_sharepoint_url: null
			},
			{
				line_id: "20",
				slno: 2,
				pr_id: "PR20260041",
				line_number: "20",
				uom: "EA",
				purchase_group: "ECR",
				quantity: 5,
				OA_Number: null,
				ARC_Number: null,
				short_text: "MacBook Pro 16",
				status: null,
				unit_price: 250000.00,
				material_code: "IT002",
				changed_on_date: "24-02-2026",
				vendor: null,
				validity_upto: null,
				material_description: "MacBook Pro 16",
				arcolumndata: "20--5.000",
				arc_sharepoint_url: null
			}
		];
	},

	getConsistencyData: () => {
		const payloads = {
			classifier: {
				PR_Num: "PR20260041",
				attachments: [
					{ kb_path: "Quote_1.pdf", category: "Quote", confidence_score: 0.98, context: "Identified as vendor quotation." },
					{ kb_path: "Technical_Specs.docx", category: "Tech Specs", confidence_score: 0.95, context: "Contains specifications for laptops." }
				]
			},
			scope: {
				status: "PASS", summary: "Scope matches perfectly.",
				scope_details: { overall_scope_summary: "The scope involves the procurement of 1 Dell XPS 15 and 5 MacBook Pro 16 laptops." },
				checkList: [{ checkCode: "RULE_SCOPE_1", status: "PASS", severity: "HIGH", what_was_checked: "PR vs Attachments", reason: "Scope aligns with attached quotations." }]
			},
			timeline: {
				status: "PASS", summary: "Delivery within 30 days.",
				timeline_details: {
					completion_details: { completion_period: "30 Days", start_date: "01-09-2026", target_completion_date: "01-10-2026" },
					warranty_details: { warranty_availability: "Yes", warranty_period: "3 Years On-Site", warranty_start_trigger: "Delivery Date" },
					payment_terms: { milestone_breakup: "100% on delivery" }
				},
				checkList: [{ checkCode: "RULE_TIME_1", status: "PASS", severity: "HIGH", what_was_checked: "Delivery SLA", reason: "Delivery SLA is acceptable." }]
			},
			boq: {
				status: "PASS", summary: "BOQ matches PR Line items.",
				boq_details: {
					overall_boq_summary: "Total BOQ value matches PR value.", boq_grand_total: 1400000.00,
					boq_items: [
						{ item_no: "10", item_description: "Laptop Dell XPS 15", quantity: 1, uom: "AU", unit_rate: 150000.00, line_amount: 150000.00 },
						{ item_no: "20", item_description: "MacBook Pro 16", quantity: 5, uom: "EA", unit_rate: 250000.00, line_amount: 1250000.00 }
					]
				},
				checkList: [{ checkCode: "RULE_BOQ_1", status: "PASS", severity: "HIGH", what_was_checked: "BOQ Total", reason: "Totals match PR line items." }]
			},
			techSpecs: {
				status: "PASS", summary: "Technical specs meet standards.",
				technical_spec_details: {
					technical_spec_availability: "Yes", overall_tech_spec_summary: "Dell and Apple specs are attached.",
					technical_parameters: [
						{ item_or_category: "Dell XPS 15", processor: "Intel i9", ram: "32GB", storage: "1TB SSD" },
						{ item_or_category: "MacBook Pro 16", processor: "M3 Max", ram: "64GB", storage: "2TB SSD" }
					]
				},
				checkList: [{ checkCode: "RULE_TECH_1", status: "PASS", severity: "HIGH", what_was_checked: "RAM", reason: "Exceeds minimum 16GB RAM." }]
			},
			assetList: {
				status: "N/A", summary: "No asset list required for new procurement.",
				asset_details: { asset_list_availability: "No", overall_asset_summary: "No replacements, all new laptops." },
				checkList: []
			},
			vendorMake: {
				status: "PASS", summary: "Makes are Dell and Apple.",
				vendor_make_details: {
					overall_make_summary: "Authorized makes requested.", procurement_method: "Competitive",
					specified_makes: [
						{ item_or_category: "Laptop", brand_make: "Dell", aml_status: "Approved" },
						{ item_or_category: "Laptop", brand_make: "Apple", aml_status: "Approved" }
					]
				},
				checkList: [{ checkCode: "RULE_MAKE_1", status: "PASS", severity: "HIGH", what_was_checked: "AML Status", reason: "Brands are in Approved Manufacturer List." }]
			},
			enfaCheck: {
				status: "PASS", summary: "eNFA matches requirement.",
				enfa_details: {
					nfa_availability: "Yes", reference_nfa_count: 1,
					enfa_registry_records: [{ ws_number: "NFA-2026-IT-099", validity_status: "Valid", scope: "IT Equipment 2026" }]
				},
				checkList: [{ checkCode: "RULE_NFA_1", status: "PASS", severity: "HIGH", what_was_checked: "NFA Validity", reason: "NFA is currently active." }]
			}
		};

		return [
			{ agent_name: 'FILE_CLASSIFICATION', agent_status: 'COMPLETED', response_payload: payloads.classifier },
			{ agent_name: 'SCOPE_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.scope },
			{ agent_name: 'TIMELINE_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.timeline },
			{ agent_name: 'BOQ_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.boq },
			{ agent_name: 'TECH_SPEC_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.techSpecs },
			{ agent_name: 'ASSET_LIST_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.assetList },
			{ agent_name: 'VENDOR_MAKE_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.vendorMake },
			{ agent_name: 'ENFA_CHECK_VALIDATION', agent_status: 'COMPLETED', response_payload: payloads.enfaCheck },
			{ agent_name: 'PR_SUMMARIZATION', agent_status: 'COMPLETED', response_payload: btoa({summary:"AI Summary: All requirements for the Dell and Apple laptops have been successfully verified across all agents."}) }
		];
	},

	getAttachments: () => {
		return [
			{ file_name: "Quote_1.pdf", source_url: "https://example.com/quote1.pdf", CATEGORY: "Quote" },
			{ file_name: "Technical_Specs.docx", source_url: "https://example.com/techspecs.docx", CATEGORY: "Tech Specs" }
		];
	},

	getVendorGroups: () => {
		return [
			{
				RFQ_GROUP_ID: 1,
				PR_ID: "PR20260041",
				PR_NUMBER: "PR20260041",
				GROUP_NAME: "Consulting Services",
				GROUP_TYPE: "SERVICES",
				SELECTED_LINES: '10',
				SELECTED_VENDORS: 'V1001,V1002,V1003',
				STATUS: "TEMPLATE_GENERATED",
				TEMPLATE_VERSION: "v1.0",
				CREATED_BY: "Ashis Kumar Jain",
				activeRound: 3,
				totalRounds: 3,
				rounds: [
					{ number: 1, label: "RFP 1", description: "Initial RFP & Baseline Bids (20 May - 31 May)", isHistorical: true },
					{ number: 2, label: "RFP 2", description: "Technical Clarifications & Revised Price (05 Jun - 18 Jun)", isHistorical: true },
					{ number: 3, label: "RFP 3", description: "Commercial BAFO", isHistorical: false }
				],
				RFQ_DATA_JSON: {
					"PR_ID": "PR20260041",
					"PR_Number": "PR20260041",
					"group_id": "1",
					"group_name": "Consulting Services",
					"Entity Year": "2026",
					"total_pr_crores": 0.024,
					"PR Value": 237594.34,
					"GMR_Entity": null,
					"GMR_ENTITY_NAME": "GMR GOA Intl Airport Ltd.",
					"GMR_ENTITY_ADDRESS": "GMR GOA INTERNATIONAL AIRPORT",
					"Buyer Name": "Aarav Sharma",
					"Bid_manager": "Parag Gautam",
					"BID_VALIDITY_PERIOD": "90 days",
					"Buyer Designation": "Buyer",
					"Email ID": "aarav.sharma@gmrgroup.in",
					"BUYER_MOBILE_NUMBER": "+91 9876543210",
					"BUYER_PHONE_NUMBER": "",
					"BUYER_ADDRESS": "GMR GOA INTERNATIONAL AIRPORT",
					"POA_NUMBER": "Form no 2",
					"NAME OF WORK": "IT Consulting Services",
					"FORM_NO": "10",
					"UNDERTAKING_FORM": "Form no 5",
					"plant_code": "1800",
					"URL": "https://gmrgroup.com",
					"Payment Terms": "Net 30",
					"Defect Liability": "Standard",
					"Secured Advance": "None",
					"Retention Money Release Bank Guarantee": "",
					"Advance Payment Bank Guarantee": "",
					"Performance Bank Guarantee": "10%",
					"Work Duration": "Delivery within 4 weeks from PO",
					"Penalty": "1% per week",
					"Identification number": "PR20260041",
					"LIQUIDATED_DAMAGE": "No",
					"CURRENT_DATE": "04 Aug 2026",
					"RFP_SEQUENCE_NUMBER": "RFQ-2026-000867",
					"BOQ": [
						{
							"description": "IT Consulting Services for System Integration",
							"material_code": "20412100001",
							"quantity": 1,
							"uom": "AU",
							"unit_rate": 237594.34,
							"currency": "INR"
						}
					],
					"line_amount": 237594.34
				}
			},
			{
				RFQ_GROUP_ID: 2,
				PR_ID: "PR20260041",
				PR_NUMBER: "PR20260041",
				GROUP_NAME: "Network Switches & Infrastructure",
				GROUP_TYPE: "HARDWARE",
				SELECTED_LINES: '20',
				SELECTED_VENDORS: 'V1004,V1005',
				STATUS: "BUYER_REVIEW",
				TEMPLATE_VERSION: "v1.0",
				CREATED_BY: "Ashis Kumar Jain",
				activeRound: 1,
				totalRounds: 1,
				rounds: [
					{ number: 1, label: "RFP 1", description: "Initial RFP Creation", isHistorical: false }
				],
				RFQ_DATA_JSON: {
					"PR_ID": "PR20260041",
					"PR_Number": "PR20260041",
					"group_id": "2",
					"group_name": "Network Switches & Infrastructure",
					"Entity Year": "2026",
					"total_pr_crores": 0.125,
					"PR Value": 1250000,
					"GMR_Entity": null,
					"GMR_ENTITY_NAME": "GMR GOA Intl Airport Ltd.",
					"GMR_ENTITY_ADDRESS": "GMR GOA INTERNATIONAL AIRPORT",
					"Buyer Name": "Aarav Sharma",
					"Bid_manager": "Parag Gautam",
					"BID_VALIDITY_PERIOD": "90 days",
					"Buyer Designation": "Buyer",
					"Email ID": "aarav.sharma@gmrgroup.in",
					"BUYER_MOBILE_NUMBER": "+91 9876543210",
					"BUYER_PHONE_NUMBER": "",
					"BUYER_ADDRESS": "GMR GOA INTERNATIONAL AIRPORT",
					"POA_NUMBER": "Form no 2",
					"NAME OF WORK": "Network Infrastructure Procurement",
					"FORM_NO": "10",
					"UNDERTAKING_FORM": "Form no 5",
					"plant_code": "1800",
					"URL": "https://gmrgroup.com",
					"Payment Terms": "Net 30",
					"Defect Liability": "Standard",
					"Secured Advance": "None",
					"Retention Money Release Bank Guarantee": "",
					"Advance Payment Bank Guarantee": "",
					"Performance Bank Guarantee": "10%",
					"Work Duration": "Delivery within 6 weeks from PO",
					"Penalty": "1% per week",
					"Identification number": "PR20260041",
					"LIQUIDATED_DAMAGE": "No",
					"CURRENT_DATE": "04 Aug 2026",
					"RFP_SEQUENCE_NUMBER": "RFQ-2026-000868",
					"BOQ": [
						{
							"description": "Cisco Catalyst 9300 48-Port PoE+ Switch",
							"material_code": "20412100002",
							"quantity": 5,
							"uom": "EA",
							"unit_rate": 250000,
							"currency": "INR"
						}
					],
					"line_amount": 1250000
				}
			}
		];
	},

	getVendorRecommendations: () => {
		return [
			{
				raw_vendor_recommendation_json: {
					groups: [
						{
							id: "GRP-IT-001",
							name: "Consulting Services",
							description: "Specialized IT consultancy for cloud migration.",
							group_type: "SERVICES",
							lineItems: ["10"],
							recommendedVendors: [
								{ vendor_id: "V1001", name: "Accenture Solutions", composite_score: 96, justification: "Leader in cloud migration.", vendor_ranking: 1, additional_info: "Priority SLA" },
								{ vendor_id: "V1002", name: "Tata Consultancy Services", composite_score: 93, justification: "Strong airport operations track record.", vendor_ranking: 2, additional_info: "Global standard" },
								{ vendor_id: "V1003", name: "Infosys Ltd", composite_score: 89, justification: "Competitive pricing.", vendor_ranking: 3, additional_info: "Fast onboarding" }
							]
						},
						{
							id: "GRP-IT-002",
							name: "Network Switches & Infrastructure",
							description: "High-throughput core networking hardware.",
							group_type: "HARDWARE",
							lineItems: ["20"],
							recommendedVendors: [
								{ vendor_id: "V1004", name: "Cisco Systems India", composite_score: 95, justification: "OEM Direct Partner.", vendor_ranking: 1, additional_info: "Immediate Dispatch" },
								{ vendor_id: "V1005", name: "Dynalog Network Solutions", composite_score: 88, justification: "Regional tier-1 distributor.", vendor_ranking: 2, additional_info: "Warranty Included" }
							]
						}
					],
					lineDetail: [
						{ lineId: "10", description: "IT Consulting Services for System Integration", qty: 1, uom: "AU" },
						{ lineId: "20", description: "Cisco Catalyst 9300 48-Port PoE+ Switch", qty: 5, uom: "EA" }
					]
				}
			}
		];
	}
}
