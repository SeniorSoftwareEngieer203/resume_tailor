// Profile to Template mapping
// Maps profile ID (filename without .json) to display name and PDF template
export const profileTemplateMapping = {
  rahulmonga: {
    resume: "Rahul Monga",
    template: "Resume-Executive-Navy",
  },
  hasan: {
    resume: "Hasan Khan",
    template: "Resume-Executive-Navy",
  },
  davide: {
    resume: "Davide Giovanardi",
    template: "Resume-Executive-Navy",
  },
  deekshith: {
    resume: "Deekshith Reddy Gopidi",
    template: "Resume-Executive-Navy",
  },
  praveen: {
    resume: "Praveen Chaulagain",
    template: "Resume-Executive-Navy",
  },
  kedar: {
    resume: "Kedar Kumar Nanda",
    template: "Resume-Executive-Navy",
  },
  swetha: {
    resume: "Swetha Bezawada",
    template: "Resume-Executive-Navy",
  },
  hardika: {
    resume: "Hardika Narula",
    template: "Resume-Executive-Navy",
  },
  oscar: {
    resume: "Oscar Adeyemi Adimi",
    template: "Resume-Executive-Navy",
  },
  /////////////////////////////
  maurice: {
    resume: "Maurice",
    template: "Resume-Executive-Navy",
  },
  sugar: {
    resume: "Sugar Ray",
    template: "Resume-Executive-Navy",
  },
  ricardo: {
    resume: "Ricardo",
    template: "Resume-Executive-Navy",
  },
  /////////////////////////////////////
  matthew: {
    resume: "Matthew",
    template: "Resume-Executive-Navy",
  },
};

/**
 * Get profile configuration by slug (numeric ID)
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {object|null} - Profile configuration or null if not found
 */
export const getProfileBySlug = (slug) => {
  if (!slug) return null;
  return profileTemplateMapping[slug] || null;
};

/**
 * Get resume name (profile name) by slug
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {string|null} - Resume name or null if not found
 */
export const slugToProfileName = (slug) => {
  const config = getProfileBySlug(slug);
  return config?.resume || null;
};

/**
 * Get template for a profile by slug
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {string} - Template ID or "Resume" as default
 */
export const getTemplateForProfile = (slug) => {
  const config = getProfileBySlug(slug);
  return config?.template || "Resume";
};

/**
 * Get all available slug values (numeric IDs from mapping)
 * @returns {string[]} - Array of available slugs (numeric IDs)
 */
export const getAvailableSlugs = () => {
  return Object.keys(profileTemplateMapping);
};

/**
 * Get profile configuration by profile ID (numeric key)
 * @param {string} profileId - The numeric profile ID
 * @returns {object|null} - Profile configuration or null if not found
 */
export const getProfileById = (profileId) => {
  return profileTemplateMapping[profileId] || null;
};

export default profileTemplateMapping;
