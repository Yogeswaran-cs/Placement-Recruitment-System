const Company = require('../models/Company');
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({}).sort({ createdAt: -1 });
  return ok(res, companies, 'Companies retrieved successfully');
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    return fail(res, 404, `Company not found with ID ${req.params.id}`);
  }
  return ok(res, company, 'Company retrieved successfully');
});

// @desc    Create company
// @route   POST /api/companies
// @access  Private
const createCompany = asyncHandler(async (req, res) => {
  const { companyId, name, role, package, eligibleDepartments, minimumCgpa, driveDate, status } = req.body;

  if (!companyId || !name || minimumCgpa === undefined || !eligibleDepartments || package === undefined) {
    return fail(res, 400, 'companyId, name, minimumCgpa, eligibleDepartments, and package are required');
  }

  // Check unique companyId
  const existing = await Company.findOne({ companyId: companyId.trim() });
  if (existing) {
    return fail(res, 400, `Company with ID '${companyId}' already exists`);
  }

  // Normalize departments
  const normalizedDeps = Array.isArray(eligibleDepartments)
    ? eligibleDepartments.map(d => d.trim().toUpperCase())
    : eligibleDepartments.split(',').map(d => d.trim().toUpperCase());

  const company = await Company.create({
    companyId: companyId.trim(),
    name: name.trim(),
    role: (role || 'Software Engineer').trim(),
    package: parseFloat(package),
    eligibleDepartments: normalizedDeps,
    minimumCgpa: parseFloat(minimumCgpa),
    driveDate: driveDate || '',
    status: status || 'upcoming'
  });

  return ok(res, company, 'Company created successfully', 201);
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = asyncHandler(async (req, res) => {
  let company = await Company.findById(req.params.id);
  if (!company) {
    return fail(res, 404, `Company not found with ID ${req.params.id}`);
  }

  const { companyId, name, role, package, eligibleDepartments, minimumCgpa, driveDate, status } = req.body;

  if (companyId) {
    const existing = await Company.findOne({ companyId: companyId.trim() });
    if (existing && existing._id.toString() !== req.params.id) {
      return fail(res, 400, `Company with ID '${companyId}' already exists`);
    }
    company.companyId = companyId.trim();
  }

  if (name) company.name = name.trim();
  if (role) company.role = role.trim();
  if (package !== undefined) company.package = parseFloat(package);
  if (minimumCgpa !== undefined) company.minimumCgpa = parseFloat(minimumCgpa);
  if (driveDate !== undefined) company.driveDate = driveDate;
  if (status) company.status = status;

  if (eligibleDepartments) {
    company.eligibleDepartments = Array.isArray(eligibleDepartments)
      ? eligibleDepartments.map(d => d.trim().toUpperCase())
      : eligibleDepartments.split(',').map(d => d.trim().toUpperCase());
  }

  await company.save();
  return ok(res, company, 'Company updated successfully');
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    return fail(res, 404, `Company not found with ID ${req.params.id}`);
  }
  await company.deleteOne();
  return ok(res, null, 'Company deleted successfully');
});

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};
