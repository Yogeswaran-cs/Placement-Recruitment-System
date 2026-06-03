const bcrypt = require('bcryptjs');

// In-Memory Database store
const dbStore = {
  users: [],
  students: [],
  companies: [],
  drives: [],
  applications: [],
  interviews: []
};

// Map mongoose model name to store key
const getStoreKey = (modelName) => {
  const lower = modelName.toLowerCase();
  if (lower.endsWith('s')) return lower; // e.g. status -> status (custom handling, but we don't have this)
  if (lower === 'user') return 'users';
  if (lower === 'student') return 'students';
  if (lower === 'company') return 'companies';
  if (lower === 'drive') return 'drives';
  if (lower === 'application') return 'applications';
  if (lower === 'interview') return 'interviews';
  return lower + 's';
};

// Generate Hex String ObjectID
const generateId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Mock Query Helper
class MockQuery {
  constructor(data, modelName) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.modelName = modelName;
    this.populatePaths = [];
    this.sortOption = null;
    this.skipCount = 0;
    this.limitCount = null;
  }

  populate(path) {
    // Save populate paths for resolution
    if (typeof path === 'string') {
      this.populatePaths.push({ path });
    } else if (typeof path === 'object' && path !== null) {
      this.populatePaths.push(path);
    }
    return this;
  }

  select(selection) {
    return this;
  }

  sort(option) {
    this.sortOption = option;
    return this;
  }

  skip(count) {
    this.skipCount = count;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  // Helper to resolve populate on a single document
  _resolvePopulate(doc) {
    if (!doc) return doc;
    
    for (const pop of this.populatePaths) {
      const field = pop.path;
      const refId = doc[field];
      
      if (!refId) continue;
      
      // Determine what model it points to based on field name or predefined mapping
      let refModel = '';
      if (field === 'company') refModel = 'Company';
      if (field === 'student') refModel = 'Student';
      if (field === 'drive') refModel = 'Drive';
      if (field === 'application') refModel = 'Application';

      if (refModel) {
        const storeKey = getStoreKey(refModel);
        const refStore = dbStore[storeKey] || [];
        
        let matched = refStore.find(item => item._id === String(refId) || item.id === String(refId));
        
        if (matched) {
          // Deep clone the populated document
          const clonedMatched = JSON.parse(JSON.stringify(matched));
          // If the populate has sub-populate, we would resolve recursively
          if (pop.populate) {
            // e.g. populating drive.company
            const subField = pop.populate.path;
            const subRefId = clonedMatched[subField];
            if (subRefId) {
              let subRefModel = '';
              if (subField === 'company') subRefModel = 'Company';
              const subStoreKey = getStoreKey(subRefModel);
              const subStore = dbStore[subStoreKey] || [];
              const subMatched = subStore.find(item => item._id === String(subRefId) || item.id === String(subRefId));
              if (subMatched) {
                clonedMatched[subField] = JSON.parse(JSON.stringify(subMatched));
              }
            }
          }
          doc[field] = clonedMatched;
        }
      }
    }
    return doc;
  }

  async exec() {
    let result = this.data;

    // Apply Sorting
    if (this.sortOption) {
      const keys = Object.keys(this.sortOption);
      if (keys.length > 0) {
        const key = keys[0];
        const direction = this.sortOption[key]; // 1 or -1 or 'asc'/'desc'
        result.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (key === 'createdAt' || key === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
          }
          if (valA < valB) return direction === -1 || direction === 'desc' ? 1 : -1;
          if (valA > valB) return direction === -1 || direction === 'desc' ? -1 : 1;
          return 0;
        });
      }
    }

    // Apply Skip & Limit
    if (this.skipCount > 0) {
      result = result.slice(this.skipCount);
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    // Resolve Populates
    if (Array.isArray(result)) {
      result = result.map(doc => this._resolvePopulate(doc));
    } else {
      result = this._resolvePopulate(result);
    }

    // Return decorated documents
    const modelClass = modelsMap[this.modelName];
    if (Array.isArray(result)) {
      return result.map(item => new modelClass(item));
    } else if (result) {
      return new modelClass(result);
    }
    return null;
  }

  // Make query object then-able (allows awaiting the query chain directly)
  then(onResolve, onReject) {
    return this.exec().then(onResolve, onReject);
  }
}

// Map of registered models
const modelsMap = {};

// Mock Schema
class Schema {
  constructor(definition, options = {}) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.statics = {};
    this._pres = { save: [] };
  }

  index() { return this; }

  pre(hook, fn) {
    if (!this._pres[hook]) this._pres[hook] = [];
    this._pres[hook].push(fn);
    return this;
  }
}

Schema.Types = {
  ObjectId: 'ObjectId'
};

// Mock Mongoose base object
const mongooseMock = {
  Schema,
  Types: Schema.Types,
  connection: {
    readyState: 1 // Connected
  },
  
  connect: async () => {
    console.log('MongoDB Connected (Mock In-Memory DB Hijack Active)');
    return {
      connection: {
        host: 'localhost-mock-db'
      }
    };
  },

  model: (name, schema) => {
    if (modelsMap[name]) {
      return modelsMap[name];
    }

    const storeKey = getStoreKey(name);

    // Dynamic Class representing a Document
    class ModelInstance {
      constructor(data = {}) {
        Object.assign(this, JSON.parse(JSON.stringify(data)));
        this._originalData = JSON.parse(JSON.stringify(data));
        if (!this._id && !this.id) {
          this._id = generateId();
        }
        this.id = this._id;
        
        // Bind methods from schema
        if (schema && schema.methods) {
          for (const methodName of Object.keys(schema.methods)) {
            this[methodName] = schema.methods[methodName].bind(this);
          }
        }
      }

      isModified(path) {
        if (!this._originalData || !(path in this._originalData)) {
          return true;
        }
        return this[path] !== this._originalData[path];
      }

      toObject() {
        return JSON.parse(JSON.stringify(this));
      }

      async save() {
        // Run pre-save hooks
        if (schema && schema._pres && schema._pres.save) {
          for (const hookFn of schema._pres.save) {
            await new Promise((resolve, reject) => {
              hookFn.call(this, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }

        this.createdAt = this.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();

        const store = dbStore[storeKey];
        const existingIdx = store.findIndex(item => item._id === this._id);
        
        const plainDoc = this.toObject();
        if (existingIdx >= 0) {
          store[existingIdx] = plainDoc;
        } else {
          store.push(plainDoc);
        }

        this._originalData = JSON.parse(JSON.stringify(plainDoc));

        return this;
      }

      async deleteOne() {
        dbStore[storeKey] = dbStore[storeKey].filter(item => item._id !== this._id);
        return { deletedCount: 1 };
      }
    }

    // Static model methods
    ModelInstance.modelName = name;
    
    ModelInstance.find = function(filter = {}) {
      let filtered = dbStore[storeKey] || [];
      
      // Basic filtering
      filtered = filtered.filter(item => {
        for (const key of Object.keys(filter)) {
          const filterVal = filter[key];
          
          // Case-insensitive search regex handling
          if (filterVal instanceof RegExp) {
            if (!item[key] || !filterVal.test(String(item[key]))) return false;
          } else if (filterVal && typeof filterVal === 'object' && filterVal.$or) {
            // Or queries
            const matchedOr = filterVal.$or.some(orQuery => {
              const orKey = Object.keys(orQuery)[0];
              const orVal = orQuery[orKey];
              if (orVal instanceof RegExp) {
                return item[orKey] && orVal.test(String(item[orKey]));
              }
              return item[orKey] === orVal;
            });
            if (!matchedOr) return false;
          } else {
            // Direct match
            if (item[key] !== filterVal) return false;
          }
        }
        return true;
      });

      return new MockQuery(filtered, name);
    };

    ModelInstance.findOne = function(filter = {}) {
      const q = ModelInstance.find(filter);
      q.limit(1);
      
      // Override exec for findOne to return single object
      const originalExec = q.exec;
      q.exec = async function() {
        const arr = await originalExec.call(this);
        return arr.length > 0 ? arr[0] : null;
      };
      
      return q;
    };

    ModelInstance.findById = function(id) {
      return ModelInstance.findOne({ _id: String(id) });
    };

    ModelInstance.findByIdAndUpdate = async function(id, update, options = {}) {
      const store = dbStore[storeKey] || [];
      const idx = store.findIndex(item => item._id === String(id));
      if (idx === -1) return null;

      // Apply update fields
      const updatedItem = {
        ...store[idx],
        ...update,
        updatedAt: new Date().toISOString()
      };
      store[idx] = updatedItem;
      return new ModelInstance(updatedItem);
    };

    ModelInstance.updateOne = async function(filter = {}, update = {}) {
      const query = ModelInstance.findOne(filter);
      const doc = await query.exec();
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      
      await ModelInstance.findByIdAndUpdate(doc._id, update);
      return { matchedCount: 1, modifiedCount: 1 };
    };

    ModelInstance.deleteOne = async function(filter = {}) {
      const query = ModelInstance.findOne(filter);
      const doc = await query.exec();
      if (!doc) return { deletedCount: 0 };
      
      await doc.deleteOne();
      return { deletedCount: 1 };
    };

    ModelInstance.create = async function(docData) {
      const instance = new ModelInstance(docData);
      await instance.save();
      return instance;
    };

    ModelInstance.countDocuments = async function(filter = {}) {
      const query = ModelInstance.find(filter);
      const items = await query.exec();
      return items.length;
    };

    // q15, q16, q17 dynamic JS aggregations
    ModelInstance.aggregate = async function(pipeline) {
      if (name === 'Student') {
        const departments = {};
        const students = dbStore.students;
        for (const s of students) {
          const dept = s.department;
          if (!departments[dept]) {
            departments[dept] = { _id: dept, total: 0, placed: 0, unplaced: 0 };
          }
          departments[dept].total++;
          if (s.status && s.status.trim().toUpperCase() === 'PLACED') {
            departments[dept].placed++;
          } else {
            departments[dept].unplaced++;
          }
        }
        return Object.values(departments);
      }

      if (name === 'Application') {
        const companiesStats = {};
        const apps = dbStore.applications;
        for (const app of apps) {
          const driveRecord = dbStore.drives.find(d => d.driveId === app.driveId);
          if (!driveRecord) continue;
          
          const companyRecord = dbStore.companies.find(c => c.companyId === driveRecord.companyId);
          if (!companyRecord) continue;

          const compName = companyRecord.name;
          if (!companiesStats[compName]) {
            companiesStats[compName] = {
              _id: compName,
              companyId: companyRecord.companyId,
              applicationsCount: 0,
              selectedCount: 0,
              shortlistedCount: 0
            };
          }
          companiesStats[compName].applicationsCount++;
          
          const appStatus = app.status ? app.status.trim().toUpperCase() : '';
          if (appStatus === 'SELECTED') {
            companiesStats[compName].selectedCount++;
          }
          if (appStatus === 'SHORTLISTED') {
            companiesStats[compName].shortlistedCount++;
          }
        }
        return Object.values(companiesStats).sort((a, b) => b.applicationsCount - a.applicationsCount);
      }

      return [];
    };

    modelsMap[name] = ModelInstance;
    return ModelInstance;
  }
};

module.exports = mongooseMock;
