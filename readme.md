# Servers.lol

What applications are a good fit for serverless? Which can utilize the benefits of event-driven architecture, blazing-fast deployment times, incredible scalability, and decreased cost? Launch this [Serverless Application Model](https://github.com/awslabs/serverless-application-model) (SAM) repository to get started and find out!

## What does it do?

This project will launch a single lambda function behind API gateway in your environment that grabs some statistics about running Elastic Beanstalk environments. Don't have any Elastic Beanstalk apps? Just skip this repo and head over to [servers.lol](https://servers.lol) to enter in information manually.

## Requirements

- Node.js
- npm or [yarn](https://yarnpkg.com/en/docs/install)
- Proper [AWS credentials](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) to launch the service

## Setup

1. Clone this repo.
2. Change the PASSWORD environment variable (Line 16) of the template.yml file to a unique password to be used for API Gateway authorization (instead of "none").
3. Run these commands inside the directory:

```bash
yarn && yarn run deploy
```

Alternatively:

```bash
npm install & npm run deploy
```

## Development

If you'd like to hack on this project, here are the details:

### Watch mode - outputs json data to console

```bash
yarn run watch
```

### Use SAM local for spinning up server (localhost:4000)

```bash
yarn run api
```
