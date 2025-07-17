/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'not-in-allowed',
      severity: 'error',
      comment:
        'This module is not in your list of allowed dependencies. Did you forget to add it to package.json?',
      from: {},
      to: {
        dependencyTypes: ['unknown', 'undetermined', 'npm-no-pkg', 'npm-unknown'],
      },
    },
  ],
  options: {
    /* options to tweak behavior */
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
