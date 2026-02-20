import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://mechanicalshopbackend.onrender.com/graphql',
  generates: {
    'src/app/core/shop-items/generated/graphql.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsConst: true,
        skipTypename: true,
        avoidOptionals: false,
      },
    },
  },
};

export default config;
