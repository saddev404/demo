export default {
  getCurrentGroupId() {
    const selectedGroup = appsmith.store.selected_vendor_group;
    if (selectedGroup && selectedGroup.RFQ_GROUP_ID) {
      return String(selectedGroup.RFQ_GROUP_ID);
    }
    return '1';
  },

  getCurrentDraft() {
    const grpId = this.getCurrentGroupId();
    const groupDrafts = appsmith.store.nfa_group_drafts || {};
    if (groupDrafts[grpId]) return groupDrafts[grpId];
    return appsmith.store.nfaDraft || null;
  },

  async _persistDraft(draft) {
    const grpId = this.getCurrentGroupId();
    const groupDrafts = { ...(appsmith.store.nfa_group_drafts || {}) };
    groupDrafts[grpId] = draft;
    await storeValue('nfa_group_drafts', groupDrafts, true);
    await storeValue('nfaDraft', draft, true);
    return draft;
  },

  async _setInnerPage(page) {
    const grpId = this.getCurrentGroupId();
    const groupPages = { ...(appsmith.store.nfa_group_pages || {}) };
    groupPages[grpId] = page;
    await storeValue('nfa_group_pages', groupPages, true);
    await storeValue('nfa_inner_page', page, true);
    return page;
  },

  async syncGroupState(targetGroupId = null) {
    const grpId = String(targetGroupId || this.getCurrentGroupId());
    const groupDrafts = { ...(appsmith.store.nfa_group_drafts || {}) };
    const groupPages = { ...(appsmith.store.nfa_group_pages || {}) };

    let draft = groupDrafts[grpId];
    if (!draft) {
      draft = await this.prepare(false, grpId);
    }

    // The separate Initiate screen has been removed. Treat legacy INITIATED
    // state as the start of Document Upload and preserve all existing draft data.
    if (String(draft?.status || '').toUpperCase() === 'INITIATED') {
      draft = { ...draft, status: 'DOCUMENT_UPLOAD', currentStep: 2 };
      groupDrafts[grpId] = draft;
      await storeValue('nfa_group_drafts', groupDrafts, true);
    }

    let page = groupPages[grpId] || this.getResumePage(draft) || 'nfa_document_upload';
    if (page === 'nfa_initiate') page = 'nfa_document_upload';

    groupPages[grpId] = page;
    await storeValue('nfa_group_pages', groupPages, true);
    await storeValue('nfaDraft', draft, true);
    await storeValue('nfa_inner_page', page, true);
    return { draft, page };
  },

  _getSelectedVendors() {
    if (typeof NFA_VENDOR_SELECTION__CheckboxGroup1 !== 'undefined' && Array.isArray(NFA_VENDOR_SELECTION__CheckboxGroup1.selectedValues) && NFA_VENDOR_SELECTION__CheckboxGroup1.selectedValues.length > 0) {
      return NFA_VENDOR_SELECTION__CheckboxGroup1.selectedValues;
    }
    const draft = this.getCurrentDraft() || appsmith.store.nfaDraft;
    if (draft?.vendorSelection?.selectedVendors && draft.vendorSelection.selectedVendors.length > 0) {
      return draft.vendorSelection.selectedVendors;
    }
    if (draft?.vendorSelection?.selectedVendor) {
      return [draft.vendorSelection.selectedVendor];
    }
    return ['ARCHICLAD FACADES LLP'];
  },

  async handleVendorSelectionChange() {
    const selected = (typeof NFA_VENDOR_SELECTION__CheckboxGroup1 !== 'undefined' && NFA_VENDOR_SELECTION__CheckboxGroup1.selectedValues) || [];
    const draft = await this.prepare(false);
    await this._persistDraft({
      ...draft,
      vendorSelection: {
        ...(draft.vendorSelection || {}),
        selectedVendors: selected,
        selectedVendor: selected[0] || null
      }
    });
  },

  _money(value) {
    if (value === null || value === undefined || String(value).trim() === '') return 0;
    const n = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  },

  _vendorPrice(name) {
    const prices = {
      'ARCHICLAD FACADES LLP': 1245000,
      'DURGA CONSTRUCTION': 1310000,
      'OMM ENTERPRISES': 1480000
    };
    return prices[name] || 0;
  },

  getDisplayNfaId() {
    return appsmith.store.nfaDraft?.nfaId || appsmith.store.nfaDraft?.nfaNo || 'Pending';
  },

  getResumePage(draft = appsmith.store.nfaDraft || {}) {
    const s = String(draft?.status || '').toUpperCase();
    if (s === 'COMPLETED') return 'nfa_submitted';
    if (s === 'APPROVER_CONFIRMATION' || s === 'APPROVER_DRAFT') return 'nfa_approver_confirmation';
    if (s === 'REVIEW_NFA' || s === 'REVIEW_DRAFT') return 'nfa_review';
    if (s === 'VENDOR_SELECTION' || s === 'VENDOR_SELECTION_DRAFT') return 'nfa_vendor_selection';
    if (s === 'MANDATORY_INFORMATION' || s === 'MANDATORY_INFORMATION_DRAFT') return 'nfa_mandatory_information';
    if (s === 'DOCUMENT_ANALYSIS') return 'nfa_document_analysis';
    if (s === 'DOCUMENT_UPLOAD' || s === 'DOCUMENT_UPLOAD_DRAFT' || s === 'INITIATED') return 'nfa_document_upload';
    return 'nfa_document_upload';
  },

  async prepare(reset = false, targetGroupId = null) {
    const currentPr = appsmith.store.selected_pr || {};
    const currentPrNo = currentPr.requisition || currentPr.sap_pr_number || currentPr.REQUISITION_NUMBER || 'PR20260041';
    const grpId = String(targetGroupId || this.getCurrentGroupId());
    const groupDrafts = appsmith.store.nfa_group_drafts || {};
    let draft = groupDrafts[grpId];

    const allGroups = (typeof js_MockData !== 'undefined' && js_MockData.getVendorGroups) ? (js_MockData.getVendorGroups() || []) : [];
    const matchedGroup = allGroups.find(g => String(g.RFQ_GROUP_ID) === grpId) || allGroups[0] || {};
    const baseDraft = js_PostRFPMockData.getNFADraft();

    if (reset || !draft || (draft.rfqGroupId && String(draft.rfqGroupId) !== grpId)) {
      draft = {
        ...baseDraft,
        rfqGroupId: grpId,
        rfqGroupName: matchedGroup.GROUP_NAME || ('RFQ Group ' + grpId),
        status: 'DOCUMENT_UPLOAD',
        currentStep: 2,
        submissionStatus: 'NOT_SUBMITTED'
      };
    } else {
      // Hydrate any missing display data from the frontend mock source without overwriting saved user edits.
      draft = {
        ...baseDraft,
        ...draft,
        rfqGroupId: grpId,
        rfqGroupName: matchedGroup.GROUP_NAME || draft.rfqGroupName || ('RFQ Group ' + grpId),
        prDetails: { ...(baseDraft.prDetails || {}), ...(draft.prDetails || {}) },
        lineItems: Array.isArray(draft.lineItems) && draft.lineItems.length ? draft.lineItems : (baseDraft.lineItems || [])
      };
    }
    draft = {
      ...draft,
      nfaId: draft?.nfaId || '',
      nfaNo: draft?.nfaNo || baseDraft?.nfaNo || '',
      prNo: currentPrNo,
      prDetails: { ...(baseDraft.prDetails || {}), ...(draft?.prDetails || {}) },
      lineItems: Array.isArray(draft?.lineItems) && draft.lineItems.length ? draft.lineItems : (baseDraft.lineItems || []),
      documents: draft?.documents || {},
      mandatoryInfo: draft?.mandatoryInfo || {},
      vendorSelection: {
        selectedVendors: draft?.vendorSelection?.selectedVendors || [],
        selectedVendor: draft?.vendorSelection?.selectedVendor || null,
        multiNFA: !!draft?.vendorSelection?.multiNFA || draft?.vendorSelection?.awardScenario === 'Split into Multiple NFAs',
        awardScenario: draft?.vendorSelection?.awardScenario || '',
        allocations: draft?.vendorSelection?.allocations || []
      },
      review: draft?.review || {},
      approvers: Array.isArray(draft?.approvers) && draft.approvers.length ? draft.approvers : [{ level: 1, name: 'Project Owner Group', role: 'Mock Existing Approver' }],
      analysisStatus: draft?.analysisStatus || 'NOT_STARTED',
      submissionStatus: draft?.submissionStatus || 'NOT_SUBMITTED',
      approvalStatus: draft?.approvalStatus || { currentApprover: '', completed: 0, pending: 0 },
      poStatus: draft?.poStatus || 'Not Created'
    };

    await this._persistDraft(draft);
    return draft;
  },

  async initiate() {
    try {
      // Compatibility entry point: initiation now happens automatically when NFA opens.
      const draft = await this.prepare(false);
      await this._persistDraft({ ...draft, status: 'DOCUMENT_UPLOAD', currentStep: 2 });
      await this._setInnerPage('nfa_document_upload');
      return true;
    } catch (e) {
      showAlert('Something went wrong. Please try again or contact support.', 'error');
      return false;
    }
  },

  _allowedUploadExtensions() {
    return ['.pdf', '.doc', '.docx', '.msg', '.eml', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.csv'];
  },

  _normalizeDocumentEntry(item) {
    if (typeof item === 'string') return { name: item, type: '', size: 0, status: 'Uploaded', uploadedAt: '' };
    return { name: item?.name || '', type: item?.type || '', size: Number(item?.size || 0), status: item?.status || 'Uploaded', uploadedAt: item?.uploadedAt || '' };
  },

  _normalizeFiles(files = []) {
    const arr = Array.isArray(files) ? files : [];
    return arr.map(file => ({
      name: file?.name || '',
      type: file?.type || '',
      size: Number(file?.size || 0),
      status: 'Uploaded',
      uploadedAt: new Date().toISOString()
    })).filter(x => x.name);
  },

  _validateFiles(files = []) {
    const arr = Array.isArray(files) ? files : [];
    if (!arr.length) {
      showAlert('Please select a file to upload.', 'warning');
      return false;
    }
    const allowed = this._allowedUploadExtensions();
    if (arr.some(file => !allowed.some(ext => String(file?.name || '').toLowerCase().endsWith(ext)))) {
      showAlert('Unsupported file format. Please upload a supported file type.', 'warning');
      return false;
    }
    if (arr.some(file => !file?.name || (file?.size !== undefined && Number(file.size) === 0))) {
      showAlert('The selected file could not be processed. Please upload a valid file.', 'warning');
      return false;
    }
    return true;
  },

  getDocumentUploadStatus(key, pickerFiles = []) {
    const saved = (appsmith.store.nfaDraft?.documents?.[key] || []).map(x => this._normalizeDocumentEntry(x)).filter(x => x.name);
    if (saved.length) return `Uploaded ✓  ${saved.length} file${saved.length === 1 ? '' : 's'} • ${saved.map(x => x.name).join(', ')}`;
    const selected = Array.isArray(pickerFiles) ? pickerFiles : [];
    return selected.length ? `Selected: ${selected.length} file${selected.length === 1 ? '' : 's'} • Click Upload` : 'Select file(s) using Browse';
  },

  async uploadDocument(key, label, pickerFiles = []) {
    const files = Array.isArray(pickerFiles) ? pickerFiles : [];
    if (!this._validateFiles(files)) return false;
    try {
      const draft = await this.prepare(false);
      const existing = (draft?.documents?.[key] || []).map(x => this._normalizeDocumentEntry(x)).filter(x => x.name);
      const incoming = this._normalizeFiles(files);
      const merged = [...existing];
      incoming.forEach(file => {
        const idx = merged.findIndex(x => x.name === file.name && Number(x.size || 0) === Number(file.size || 0));
        if (idx >= 0) merged[idx] = file; else merged.push(file);
      });
      await storeValue('nfaDraft', { ...draft, status: 'DOCUMENT_UPLOAD', currentStep: 2, documents: { ...(draft.documents || {}), [key]: merged } }, true);
      showAlert(`${label} uploaded successfully.`, 'success');
      return true;
    } catch (e) {
      showAlert('Document upload failed. Please try again.', 'error');
      return false;
    }
  },

  async saveDocumentDraft() {
    try {
      const draft = await this.prepare(false);
      await this._persistDraft({ ...draft, status: 'DOCUMENT_UPLOAD_DRAFT', currentStep: 2 });
      showAlert('Document draft saved successfully.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  async submitDocuments() {
    try {
      const draft = await this.prepare(false);
      // Integrated flow: document upload is optional, so empty categories do not block progression.
      await this._persistDraft({ ...draft, status: 'DOCUMENT_ANALYSIS', analysisStatus: 'PROCESSING', currentStep: 2 });
      await this._setInnerPage('nfa_document_analysis');
      return true;
    } catch (e) {
      showAlert('Something went wrong. Please try again or contact support.', 'error');
      return false;
    }
  },

  async waitForAnalysis() {
    try {
      const draft = await this.prepare(false);
      if (draft.analysisStatus === 'FAILED') {
        showAlert('Document analysis could not be completed. Please retry.', 'error');
        await this._persistDraft({ ...draft, analysisStatus: 'PROCESSING', status: 'DOCUMENT_ANALYSIS' });
        return true;
      }
      // Frontend-only simulation of the external extraction completing while the buyer waits.
      await this._persistDraft({ ...draft, analysisStatus: 'SUCCESS', status: 'MANDATORY_INFORMATION', currentStep: 3 });
      showAlert('Document analysis completed successfully.', 'success');
      await this._setInnerPage('nfa_mandatory_information');
      return true;
    } catch (e) {
      showAlert('Document analysis could not be completed. Please retry.', 'error');
      return false;
    }
  },

  getMandatorySupportingLabel(key) {
    const saved = appsmith.store.nfaDraft?.mandatoryInfo?.supportingDocuments?.[key] || [];
    if (saved.length) return `Attached ✓ ${saved.map(x => x.name || x).join(', ')}`;
    return 'Attach Document';
  },

  _optionalSupporting(files = [], existing = []) {
    const arr = Array.isArray(files) ? files : [];
    if (!arr.length) return existing || [];
    const allowed = this._allowedUploadExtensions();
    const unsupported = arr.some(file => !allowed.some(ext => String(file?.name || '').toLowerCase().endsWith(ext)));
    if (unsupported) throw new Error('UNSUPPORTED_FILE');
    return this._normalizeFiles(arr);
  },

  async saveMandatory(goNext = false) {
    const vendorCode = String(NFA_MANDATORY_INFORMATION__FI1.text || '').trim();
    const paymentTerms = String(NFA_MANDATORY_INFORMATION__FI3.text || '').trim();
    if (goNext && (!vendorCode || !paymentTerms)) {
      showAlert('Please complete all mandatory fields before continuing.', 'warning');
      return false;
    }
    try {
      const draft = await this.prepare(false);
      const existingSupport = draft?.mandatoryInfo?.supportingDocuments || {};
      let vendorSupport, paymentSupport;
      try {
        vendorSupport = this._optionalSupporting(NFA_MANDATORY_INFORMATION__FS1.files, existingSupport.vendorCode);
        paymentSupport = this._optionalSupporting(NFA_MANDATORY_INFORMATION__FS3.files, existingSupport.paymentTerms);
      } catch (e) {
        if (String(e?.message) === 'UNSUPPORTED_FILE') {
          showAlert('Unsupported file format. Please upload a supported file type.', 'warning');
          return false;
        }
        throw e;
      }
      const mandatoryInfo = {
        ...(draft.mandatoryInfo || {}),
        vendorCode,
        paymentTerms,
        supportingDocuments: { vendorCode: vendorSupport, paymentTerms: paymentSupport }
      };
      await storeValue('nfaDraft', { ...draft, mandatoryInfo, status: goNext ? 'VENDOR_SELECTION' : 'MANDATORY_INFORMATION_DRAFT', currentStep: goNext ? 4 : 3 }, true);
      if (goNext) await this._setInnerPage('nfa_vendor_selection');
      showAlert(goNext ? 'Mandatory information completed.' : 'Mandatory information draft saved.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  _splitInputs() {
    return [
      typeof NFA_VENDOR_SELECTION__NFAAmount1 !== 'undefined' ? NFA_VENDOR_SELECTION__NFAAmount1 : null,
      typeof NFA_VENDOR_SELECTION__NFAAmount2 !== 'undefined' ? NFA_VENDOR_SELECTION__NFAAmount2 : null,
      typeof NFA_VENDOR_SELECTION__NFAAmount3 !== 'undefined' ? NFA_VENDOR_SELECTION__NFAAmount3 : null,
      typeof NFA_VENDOR_SELECTION__NFAAmount4 !== 'undefined' ? NFA_VENDOR_SELECTION__NFAAmount4 : null
    ].filter(Boolean);
  },

  getSplitRowCount() {
    const a = appsmith.store.nfaDraft?.vendorSelection?.allocations || [];
    return Math.max(1, Math.min(4, a.length || 1));
  },

  _readSplitAllocations() {
    const count = this.getSplitRowCount();
    const inputs = this._splitInputs();
    return Array.from({length: count}, (_,i) => ({ sequence: i + 1, amount: String(inputs[i]?.text ?? '').trim() }));
  },

  async handleMultiNFAToggle() {
    try {
      const draft = await this.prepare(false);
      const selected = this._getSelectedVendors();
      const multiNFA = typeof NFA_VENDOR_SELECTION__MultiNFASwitch !== 'undefined'
        ? !!NFA_VENDOR_SELECTION__MultiNFASwitch.isSwitchedOn
        : true;
      let allocations = draft?.vendorSelection?.allocations || [];
      // The first NFA allocation card is always visible in the original UI.
      if (!allocations.length) allocations = [{ sequence: 1, amount: '' }];
      if (!multiNFA) allocations = [allocations[0] || { sequence: 1, amount: '' }];
      const awardScenario = multiNFA
        ? 'Split into Multiple NFAs'
        : (selected.length > 1 ? 'Multiple Vendor Award' : (selected.length === 1 ? 'Single Vendor Award' : ''));
      await this._persistDraft({
        ...draft,
        vendorSelection: {
          ...(draft.vendorSelection || {}),
          selectedVendors: selected,
          selectedVendor: selected[0] || 'ARCHICLAD FACADES LLP',
          multiNFA,
          awardScenario,
          allocations
        }
      });
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  async addSplitAllocation() {
    const selected = this._getSelectedVendors();
    const multiNFA = typeof NFA_VENDOR_SELECTION__MultiNFASwitch !== 'undefined'
      ? !!NFA_VENDOR_SELECTION__MultiNFASwitch.isSwitchedOn
      : true;
    if (!multiNFA) return false;
    if (!selected || selected.length === 0) {
      showAlert('Please select at least one vendor to continue.', 'warning');
      return false;
    }
    try {
      const draft = await this.prepare(false);
      let allocations = this._readSplitAllocations();
      if (allocations.length >= 4) { showAlert('Four split rows are already available in the demo.', 'info'); return false; }
      allocations.push({ sequence: allocations.length + 1, amount: '' });
      await this._persistDraft({
        ...draft,
        vendorSelection: {
          ...(draft.vendorSelection || {}),
          selectedVendors: selected,
          selectedVendor: selected[0] || 'ARCHICLAD FACADES LLP',
          multiNFA: true,
          awardScenario: 'Split into Multiple NFAs',
          allocations
        }
      });
      showAlert('Split NFA row added.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  async removeSplitAllocation(index = 0) {
    try {
      const draft = await this.prepare(false);
      let allocations = this._readSplitAllocations();
      if (allocations.length <= 1) allocations = [{ sequence: 1, amount: '' }];
      else allocations.splice(index, 1);
      allocations = allocations.map((a, idx) => ({ sequence: idx + 1, amount: a.amount }));
      await this._persistDraft({
        ...draft,
        vendorSelection: {
          ...(draft.vendorSelection || {}),
          multiNFA: true,
          awardScenario: 'Split into Multiple NFAs',
          allocations
        }
      });
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  getAllocationSummary() {
    const selected = this._getSelectedVendors();
    const multiNFA = typeof NFA_VENDOR_SELECTION__MultiNFASwitch !== 'undefined'
      ? !!NFA_VENDOR_SELECTION__MultiNFASwitch.isSwitchedOn
      : !!this.getCurrentDraft()?.vendorSelection?.multiNFA;
    if (!multiNFA) {
      if (!selected.length) return 'Select one or more qualified vendors';
      return selected.length === 1 ? 'Award Scenario: Single Vendor Award' : 'Award Scenario: Multiple Vendor Award';
    }
    const a = this.getCurrentDraft()?.vendorSelection?.allocations || [];
    return `Number of NFAs: ${Math.max(1, a.length || 1)}  •  Split allocation must match the selected vendor award value`;
  },

  async saveVendor(goNext = false) {
    const selected = this._getSelectedVendors();
    const multiNFA = typeof NFA_VENDOR_SELECTION__MultiNFASwitch !== 'undefined'
      ? !!NFA_VENDOR_SELECTION__MultiNFASwitch.isSwitchedOn
      : !!this.getCurrentDraft()?.vendorSelection?.multiNFA;
    if (goNext && (!selected || !selected.length)) {
      showAlert('Please select at least one vendor to continue.', 'warning');
      return false;
    }
    try {
      const draft = await this.prepare(false);
      const scenario = multiNFA
        ? 'Split into Multiple NFAs'
        : (selected.length > 1 ? 'Multiple Vendor Award' : 'Single Vendor Award');
      let allocations = [];
      if (multiNFA) {
        allocations = this._readSplitAllocations();
        if (allocations.some(x => !String(x.amount).trim())) {
          showAlert('Please enter an award amount.', 'warning');
          return false;
        }
        allocations = allocations.map(x => ({ sequence: x.sequence, amount: this._money(x.amount) }));
      }
      const vendorSelection = {
        selectedVendors: selected,
        selectedVendor: selected[0] || null,
        multiNFA,
        awardScenario: scenario,
        allocations
      };
      await this._persistDraft({
        ...draft,
        vendorSelection,
        status: goNext ? 'REVIEW_NFA' : 'VENDOR_SELECTION_DRAFT',
        currentStep: goNext ? 5 : 4
      });
      if (goNext) await this._setInnerPage('nfa_review');
      showAlert(goNext ? 'Vendor selection saved. Opening Review NFA.' : 'Vendor selection draft saved.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  getDocumentNamesSummary() {
    const docs = this.getCurrentDraft()?.documents || appsmith.store.nfaDraft?.documents || {};
    const names = Object.values(docs).flat().map(x => x?.name).filter(Boolean);
    if (!names.length) return 'None';
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` + ${names.length - 3} more` : '');
  },

  async saveReview(goNext = false) {
    const required = [
      String(NFA_REVIEW__RecommendationInput.text || '').trim(),
      String(NFA_REVIEW__PlantBusinessInput.text || '').trim(),
      String(NFA_REVIEW__PRNoInput.text || '').trim()
    ];
    if (goNext && required.some(x => !x)) {
      showAlert('Please complete all mandatory NFA fields before continuing.', 'warning');
      return false;
    }
    try {
      const draft = await this.prepare(false);
      const review = {
        RecommendationInput:NFA_REVIEW__RecommendationInput.text,
        PlantBusinessInput:NFA_REVIEW__PlantBusinessInput.text,
        PRNoInput:NFA_REVIEW__PRNoInput.text,
        PRVerticalInput:NFA_REVIEW__PRVerticalInput.text,
        ScopeWork:NFA_REVIEW__ScopeWorkValue.text,
        AttachmentDetails:NFA_REVIEW__AttachmentDetails.text,
        BudgetStatus:NFA_REVIEW__BudgetStatus.text,
        Currency:NFA_REVIEW__Currency.text,
        BudgetAmount:NFA_REVIEW__BudgetAmount.text,
        VendorName:NFA_REVIEW__VendorName.text,
        VendorCode:NFA_REVIEW__VendorCode.text,
        ContactPerson:NFA_REVIEW__ContactPerson.text,
        VendorMail:NFA_REVIEW__VendorMail.text,
        OrderBasic:NFA_REVIEW__OrderBasic.text,
        GSTPercent:NFA_REVIEW__GSTPercent.text,
        GSTAmount:NFA_REVIEW__GSTAmount.text,
        PurposeJustification:NFA_REVIEW__PurposeJustificationValue.text,
        DeliveryStart:NFA_REVIEW__DeliveryStart.text,
        DeliveryEnd:NFA_REVIEW__DeliveryEnd.text,
        DeliveryNote:NFA_REVIEW__DeliveryNoteValue.text,
        DeliveryClauseNA1:NFA_REVIEW__DeliveryClauseNA1.text,
        DeliveryClauseNA2:NFA_REVIEW__DeliveryClauseNA2.text,
        PaymentTerms:NFA_REVIEW__PaymentTermsValue.text,
        BankGuarantee1:NFA_REVIEW__BankGuarantee1.text,
        BankGuarantee2:NFA_REVIEW__BankGuarantee2.text,
        BankGuarantee3:NFA_REVIEW__BankGuarantee3.text,
        BankGuarantee4:NFA_REVIEW__BankGuarantee4.text,
        PriceEscalation:NFA_REVIEW__PriceEscalationValue.text,
        DeliveryAddress:NFA_REVIEW__DeliveryAddressValue.text,
        LiquidatedDamages:NFA_REVIEW__LiquidatedDamagesValue.text,
        Warranty:NFA_REVIEW__WarrantyValue.text,
        VendorJustificationLowest:NFA_REVIEW__VendorJustificationLowest.text,
        VendorJustificationSingle:NFA_REVIEW__VendorJustificationSingle.text,
        VendorJustificationRepeat:NFA_REVIEW__VendorJustificationRepeat.text,
        VendorJustificationRate:NFA_REVIEW__VendorJustificationRate.text,
        VendorJustificationOEM:NFA_REVIEW__VendorJustificationOEM.text,
        VendorJustificationPrefer:NFA_REVIEW__VendorJustificationPrefer.text,
        ExceededBudget:NFA_REVIEW__ExceededBudget.text,
        DeviationPolicies:NFA_REVIEW__DeviationPolicies.text,
        DOPApproval:NFA_REVIEW__DOPApproval.text,
        OtherTerms1:NFA_REVIEW__OtherTerms1.text,
        OtherTerms2:NFA_REVIEW__OtherTerms2.text,
        OtherTerms3:NFA_REVIEW__OtherTerms3.text,
        OtherTerms4:NFA_REVIEW__OtherTerms4.text,
        OtherTerms5:NFA_REVIEW__OtherTerms5.text
      };
      await storeValue('nfaDraft', { ...draft, review:{ ...(draft.review || {}), ...review }, status:goNext ? 'APPROVER_CONFIRMATION' : 'REVIEW_DRAFT', currentStep:goNext ? 6 : 5 }, true);
      if (goNext) await this._setInnerPage('nfa_approver_confirmation');
      showAlert(goNext ? 'Review saved. Configure the approval hierarchy.' : 'NFA review draft saved.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  _normaliseApprovers(list) {
    return (list || []).filter(a => a && String(a.name || '').trim()).map((a,i) => ({ ...a, name:String(a.name).trim(), level:i+1 }));
  },

  getApprover(index) { return (appsmith.store.nfaDraft?.approvers || [])[index] || null; },

  getApproverSummary() {
    const list = this._normaliseApprovers(appsmith.store.nfaDraft?.approvers || []);
    return list.length ? list.map(a => `Level ${a.level}: ${a.name}`).join('   •   ') : 'No approvers configured yet.';
  },

  async openNextApproverCard() {
    try {
      const draft = await this.prepare(false);
      const list = this._normaliseApprovers(draft.approvers || []);
      const nextLevel = list.length + 1;
      if (nextLevel > 4) {
        showAlert('All available demo approver levels are already configured.', 'info');
        return false;
      }
      await storeValue('nfa_approver_edit_level', nextLevel);
      return true;
    } catch (e) {
      return false;
    }
  },

  async saveApproverLevel(level, nameValue) {
    const name = String(nameValue || '').trim();
    if (!name) {
      showAlert('Please enter an approver name.', 'warning');
      return false;
    }
    try {
      const draft = await this.prepare(false);
      let list = this._normaliseApprovers(draft.approvers || []);
      const index = Number(level) - 1;
      if (index < 0 || index > list.length) return false;
      if (list.some((a,i) => i !== index && a.name.toLowerCase() === name.toLowerCase())) {
        showAlert('This approver is already assigned. Please review the approval hierarchy.', 'warning');
        return false;
      }
      const replacing = !!list[index];
      if (replacing) list[index] = { ...list[index], name, role:list[index].role || 'Buyer Specified' };
      else list.push({ level:index + 1, name, role:'Buyer Specified' });
      list = this._normaliseApprovers(list);
      await this._persistDraft({ ...draft, approvers:list });
      await storeValue('nfa_approver_edit_level', null);
      showAlert(replacing ? 'Approver replaced.' : 'Approver added.', 'success');
      return true;
    } catch (e) {
      showAlert('Unable to save your changes. Please try again.', 'error');
      return false;
    }
  },

  async addApprover() {
    return this.saveApproverLevel(2, NFA_APPROVER_CONFIRMATION__inp_Approver2.text);
  },

  async replaceApprover(index = 0, nameValue = '') {
    return this.saveApproverLevel(index + 1, nameValue);
  },

  async deleteApprover(index = 0) {
    try {
      const draft = await this.prepare(false);
      let list = this._normaliseApprovers(draft.approvers || []);
      if (!list[index]) return false;
      list.splice(index,1);
      list = this._normaliseApprovers(list);
      await this._persistDraft({...draft,approvers:list});
      await storeValue('nfa_approver_edit_level', null);
      showAlert('Approver removed and levels renumbered.','success');
      return true;
    } catch(e){ return false; }
  },

  async deleteLastApprover() {
    const list=this._normaliseApprovers(appsmith.store.nfaDraft?.approvers || []);
    if (!list.length) return false;
    return this.deleteApprover(list.length-1);
  },

  async saveApproverDraft() {
    try {
      const draft=await this.prepare(false);
      const list=this._normaliseApprovers(draft.approvers);
      await this._persistDraft({...draft,approvers:list,status:'APPROVER_DRAFT',currentStep:6});
      showAlert('Approval hierarchy draft saved.','success');
      return true;
    } catch(e){
      showAlert('Unable to save your changes. Please try again.','error');
      return false;
    }
  },

  async submitForApproval() {
    try {
      const draft=await this.prepare(false); const list=this._normaliseApprovers(draft.approvers);
      if (!list.length) { showAlert('Please add at least one approver.','warning'); return false; }
      const updated={...draft,status:'COMPLETED',currentStep:7,submissionStatus:'PENDING_APPROVAL',approvers:list,approvalStatus:{currentApprover:list[0].name,completed:0,pending:list.length},poStatus:'Not Created'};
      await this._persistDraft(updated); await this._setInnerPage('nfa_submitted'); showAlert('NFA submitted successfully.','success'); return true;
    } catch(e){ showAlert('NFA submission failed. Please try again.','error'); return false; }
  },

  async retrySubmission() {
    const draft=await this.prepare(false);
    if (draft.submissionStatus === 'PROCESSING') { showAlert('Your NFA is being submitted. Please wait for the process to complete.','warning'); return false; }
    if (draft.submissionStatus !== 'FAILED') return false;
    try {
      const list=this._normaliseApprovers(draft.approvers);
      await storeValue('nfaDraft',{...draft,submissionStatus:'PENDING_APPROVAL',approvalStatus:{currentApprover:list[0]?.name || '',completed:0,pending:list.length}},true);
      showAlert('NFA submitted successfully.','success'); return true;
    } catch(e){ showAlert('Something went wrong while processing your request. Please try again or contact support.','error'); return false; }
  },

  async goDashboard() { return navigateTo('pg_BuyerDashboard'); }
};