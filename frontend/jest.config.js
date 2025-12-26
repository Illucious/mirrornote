module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: false,
                skipLibCheck: true,
            },
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        '__tests__/**/*.{ts,tsx}',
        '!**/node_modules/**'
    ],
    passWithNoTests: true,
};
