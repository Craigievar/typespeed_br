A battle royale where you have to out-type your opponents

## Starting the stack locally

`./run_local.sh`

This starts all of the services, attaches file watchers, and runs them using
the default local config. Each service

## NPM commands

Each of the services conforms to the same pattern of npm commands to run:

| build | Builds the app using babel, and dumps it into the `/build` folder |
| start | Runs the built app, found in the `/build` folder |
| start-local | Runs the server in dev mode, and attaches file watchers for restarting on file save. |

## Local Development

### Where services run
| Service Name | Port |
| Static asset server | 3000 |
| Matchmaking server | 8081 |
| Game instance manager | 8082 |
| Game instance | 8083 |
