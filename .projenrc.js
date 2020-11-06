const { TypeScriptProject, StartEntryCategory, GithubWorkflow } = require('projen');

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
project.npmignore.exclude('docs');

const yarnUp = new GithubWorkflow(project, 'yarn-upgrade');

yarnUp.on({
    schedule: [{ cron: '0 6 * * *'}],
    workflow_dispatch: {},
});

yarnUp.addJobs({
    upgrade: {
        'name': 'Yarn Upgrade',
        'runs-on': 'ubuntu-latest',
        'steps': [
            { uses: 'actions/checkout@v2' },
            { run: 'yarn install --frozen-lockfile' },
            { run: 'yarn upgrade' },
            { run: 'yarn build' },
            { run: 'yarn projen' },
            {
                name: 'Create Pull Request',
                uses: 'peter-evans/create-pull-request@v3',
                with: {
                    title: 'chore: automatic yarn upgrade',
                    token: 'YARN_UPGRADE_TOKEN',
                },
            },
        ],
    },
});

project.mergify.addRule({
    name: 'Merge pull requests automatic yarn upgrade if CI passes',
    conditions: [
        "head=create-pull-request/patch",
        "status-success=build"
    ],
    actions: {
        merge: {
            method: 'merge',
            commit_message: 'title+body',
        },
    }
})

project.addScript('docgen', 'typedoc --out docs src/index.ts && touch docs/.nojekyll', {
    startCategory: StartEntryCategory.RELEASE,
});

project.synth();
