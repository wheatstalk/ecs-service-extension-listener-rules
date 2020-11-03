const { TypeScriptProject, StartEntryCategory } = require('projen');

const project = new TypeScriptProject({
    authorAddress: 'joshkellendonk@gmail.com',
    authorName: 'Josh Kellendonk',
    name: '@wheatstalk/ecs-service-extension-listener-rules',
    repository: 'https://github.com/wheatstalk/ecs-service-extension-listener-rules.git',
    // Use workflow dispatch from the github ui to release.
    workflowBootstrapSteps: [
        ...TypeScriptProject.DEFAULT_WORKFLOW_BOOTSTRAP,
        {
            name: 'Regenerate the docs',
            run: './auto-docs.sh',
        },
    ],
    releaseEveryCommit: false,
    releaseToNpm: true,
    deps: [
        '@aws-cdk-containers/ecs-service-extensions@^1.71.0',
        '@aws-cdk/aws-ecs@^1.71.0',
        '@aws-cdk/aws-elasticloadbalancingv2@^1.71.0',
        '@aws-cdk/core@^1.71.0',
    ],
    devDeps: [
        'typedoc@beta',
        '@aws-cdk/assert@^1.71.0',
        '@aws-cdk/aws-ec2@^1.71.0',
    ],
});

project.gitignore.exclude('.idea', 'cdk.out');

project.addScript('docgen', 'typedoc --out docs src/index.ts && touch docs/.nojekyll', {
    startCategory: StartEntryCategory.RELEASE,
});

project.synth();
