export default {
  MOCK_MODE: true,

  _list(raw) {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (raw === null || raw === undefined || String(raw).trim() === '') return [];
    if (typeof raw === 'string') {
      try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.filter(Boolean); } catch(e) {}
      return raw.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [raw];
  },

  getSelectedGroup() {
    const selected = appsmith.store.selected_vendor_group || {};
    if (selected.RFQ_GROUP_ID) return selected;
    const groups = (typeof js_MockData !== 'undefined' && js_MockData.getVendorGroups) ? (js_MockData.getVendorGroups() || []) : [];
    return groups[0] || {};
  },

  getRFQName() {
    const g = this.getSelectedGroup();
    return g.GROUP_NAME || g.group_name || appsmith.store.selected_pr?.category || 'Selected RFQ';
  },

  getPreValidationRows() {
    const vendors = this._list(this.getSelectedGroup().SELECTED_VENDORS);
    const vendorDetail = vendors.length
      ? `${vendors.length} selected vendor(s): ${vendors.join(', ')}`
      : 'Techno Valves Pvt Ltd (SAP: 1001234)';
    const base = [
      {check:'Vendor selected with Vendor Name & ERP ID (SAP Vendor Code)',status:'PASSED',details:vendorDetail,action:'View'},
      {check:'Vendor Contact Person available',status:'PASSED',details:'Mr. Arjun Mehta',action:'View / Edit'},
      {check:'Contact Email & Mobile details (for notification)',status:'PASSED',details:'arjun.mehta@example.com • +91 98765 43210',action:'View / Edit'},
      {check:'Ariba Event Sourcing Template',status:'PENDING',details:'Template not selected',action:'Select'},
      {check:'Technical Team Assigned',status:'PENDING',details:'No technical team assigned',action:'Assign'},
      {check:'Commercial Team Assigned',status:'PENDING',details:'No commercial team assigned',action:'Assign'},
      {check:'Event Rules & Configuration',status:'ATTENTION',details:'Incomplete configuration',action:'Configure'},
      {check:'Mandatory Documents Attached',status:'PENDING',details:'3 of 6 mock documents uploaded',action:'Upload'}
    ];
    const overrides = appsmith.store.prevalidation_mock_overrides || {};
    return base.map(r => overrides[r.check] ? {...r, ...overrides[r.check]} : r);
  },

  getPreValidationTableData() {
    const icon = {PASSED:'✓ Passed',PENDING:'○ Pending',ATTENTION:'⚠ Attention',NOT_STARTED:'○ Not Started'};
    return this.getPreValidationRows().map((r,i) => ({
      '#': i + 1,
      'Validation Check': r.check,
      'Status': icon[r.status] || r.status,
      'Details': r.details,
      'Action': r.action
    }));
  },

  getPreValidationSummary() {
    const rows = this.getPreValidationRows();
    const total = rows.length || 1;
    const passed = rows.filter(r => r.status === 'PASSED').length;
    const completionPercent = Math.round((passed / total) * 100);
    return {
      passed,
      pending: rows.filter(r => r.status === 'PENDING').length,
      attention: rows.filter(r => r.status === 'ATTENTION').length,
      notStarted: rows.filter(r => r.status === 'NOT_STARTED').length,
      completionPercent,
      remainingPercent: 100 - completionPercent
    };
  },

  canSendRFP() {
    const rows = this.getPreValidationRows();
    return rows.length > 0 && rows.every(r => r.status === 'PASSED');
  },

  getCreationStatus() {
    return {
      sapRfqNumber: '6000123456',
      createdOn: '08 Sep 2026, 03:30 PM',
      eventId: 'EVT-MOCK-000567',
      eventStatus: 'Published'
    };
  },

  getNFADraft() {
    const pr = appsmith.store.selected_pr || {};
    const group = this.getSelectedGroup();
    const raw = (typeof js_MockData !== 'undefined' && js_MockData.getLineItems) ? (js_MockData.getLineItems() || []) : [];
    const lineItems = raw.length ? raw.map((x,i) => ({
      line: x.line_id || x.LINE_ID || i + 1,
      itemCode: x.material_code || x.MATERIAL_CODE || '',
      description: x.short_text || x.SHORT_TEXT || x.material_description || 'Demo line item',
      quantity: x.quantity || x.QUANTITY || 0,
      uom: x.uom || x.UOM || '',
      value: Number(x.unit_price || x.UNIT_PRICE || 0) * Number(x.quantity || x.QUANTITY || 1)
    })) : [
      {line:1,itemCode:'MAT-001',description:'Standard Workstation Type A',quantity:1,uom:'AU',value:150000},
      {line:2,itemCode:'MAT-002',description:'High-Performance Workstation Type B',quantity:5,uom:'NOS',value:1250000}
    ];

    return {
      nfaNo: '9000016457',
      prNo: pr.requisition || pr.sap_pr_number || 'PR20260041',
      status: 'DRAFT',
      currentStep: 1,
      rfqGroupId: group.RFQ_GROUP_ID || '',
      rfqGroupName: this.getRFQName(),
      prDetails: {
        title: pr.category || this.getRFQName(),
        category: pr.category || 'IT Procurement',
        entity: 'GMR Group',
        value: pr.value || 1400000,
        currency: 'INR',
        scope: 'Procurement scope carried forward from the frontend demo.'
      },
      lineItems,
      documents: {},
      analysisStatus: 'NOT_STARTED',
      mandatoryInfo: {},
      vendorSelection: {selectedVendors:[],selectedVendor:null,awardScenario:'',allocations:[]},
      review: {},
      approvers: [{level:1,name:'Project Owner Group',role:'Mock Existing Approver'}],
      submissionStatus: 'NOT_SUBMITTED'
    };
  }
};