def harborArtifactUrl() {
    return "https://${env.REGISTRY}/api/v2.0/projects/${env.HARBOR_PROJECT}/repositories/${env.HARBOR_REPOSITORY}/artifacts/${env.IMAGE_TAG}"
}

def waitForHarborScan() {

    echo "Waiting for Harbor vulnerability scan..."

    timeout(time: 5, unit: 'MINUTES') {

        waitUntil {

            def status = sh(
                script: '''
                    set +e

                    HTTP_STATUS=$(curl -sk \
                        --user "$HARBOR_USER:$HARBOR_PASSWORD" \
                        -o harbor-artifact.json \
                        -w "%{http_code}" \
                        "${HARBOR_ARTIFACT_URL}?with_scan_overview=true")

                    if [ "$HTTP_STATUS" != "200" ]; then
                        echo "NOT_READY"
                        exit 0
                    fi

                    python3 <<'PY'
import json

try:
    with open("harbor-artifact.json") as f:
        data = json.load(f)
except Exception:
    print("NOT_READY")
    raise SystemExit

scan_overview = data.get("scan_overview") or {}

status = "NOT_SCANNED"

for report in scan_overview.values():
    if isinstance(report, dict):
        value = report.get("scan_status")
        if value:
            status = value
            break

print(status)
PY
                ''',
                returnStdout: true
            ).trim()

            echo "Harbor scan status: ${status}"

            if (
                status == 'Complete' ||
                status == 'Finished' ||
                status == 'Success'
            ) {
                echo "Harbor vulnerability scan completed."
                return true
            }

            if (
                status == 'Error' ||
                status == 'Failed' ||
                status == 'Stopped'
            ) {
                error(
                    "Harbor vulnerability scan failed. " +
                    "Scan status: ${status}"
                )
            }

            sleep 10
            return false
        }
    }
}

def getVulnerabilityReport() {

    sh '''
        curl -fsSk \
            --user "$HARBOR_USER:$HARBOR_PASSWORD" \
            -o harbor-vulnerability-report.json \
            "$HARBOR_VULNERABILITY_URL"
    '''
}

def getVulnerabilityCounts() {

    return sh(
        script: '''
            python3 <<'PY'
import json

with open("harbor-vulnerability-report.json") as f:
    data = json.load(f)

counts = {
    "Critical": 0,
    "High": 0,
    "Medium": 0,
    "Low": 0,
    "Unknown": 0
}

report = data.get(
    "application/vnd.security.vulnerability.report; version=1.1",
    {}
)

vulnerabilities = report.get("vulnerabilities", [])

for vulnerability in vulnerabilities:

    severity = vulnerability.get("severity", "Unknown")

    if severity not in counts:
        counts[severity] = 0

    counts[severity] += 1

print(
    f'{counts["Critical"]} '
    f'{counts["High"]} '
    f'{counts["Medium"]} '
    f'{counts["Low"]} '
    f'{counts["Unknown"]}'
)
PY
        ''',
        returnStdout: true
    ).trim().split()
}

def printSecurityReport(counts) {

    echo """
========================================
        HARBOR SECURITY SCAN
========================================
Critical : ${counts[0]}
High     : ${counts[1]}
Medium   : ${counts[2]}
Low      : ${counts[3]}
Unknown  : ${counts[4]}
========================================
"""
}

def enforceSecurityPolicy(counts) {

    def critical = counts[0].toInteger()

    if (critical > 0) {

        error(
            "SECURITY GATE FAILED: " +
            "${critical} Critical vulnerability/vulnerabilities found."
        )
    }

    echo "SECURITY GATE PASSED: No Critical vulnerabilities."
}


pipeline {

    agent {
        label 'docker-builder'
    }

    environment {

        APP_NAME = 'hello-cicd'

        REGISTRY = 'registry.pspworks.cloud'

        HARBOR_PROJECT = 'hello-cicd'
        HARBOR_REPOSITORY = 'hello-cicd'

        IMAGE_TAG = "${env.BUILD_NUMBER}"

        DEPLOY_HOST = '72.60.78.85'
        DEPLOY_PORT = '22022'
        DEPLOY_USER = 'deploy'
    }

    stages {

        stage('Checkout') {

            steps {
                checkout scm
            }
        }


        stage('Install Dependencies') {

            steps {
                sh 'npm install'
            }
        }


        stage('Build Docker Image') {

            steps {

                sh """
                    docker build \
                        -t ${REGISTRY}/${APP_NAME}/${APP_NAME}:${IMAGE_TAG} \
                        .
                """
            }
        }


        stage('Push to Harbor') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'harbor-registry',
                        usernameVariable: 'HARBOR_USER',
                        passwordVariable: 'HARBOR_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "$HARBOR_PASSWORD" | docker login "$REGISTRY" \
                            --username "$HARBOR_USER" \
                            --password-stdin

                        docker push \
                            "$REGISTRY/$APP_NAME/$APP_NAME:$IMAGE_TAG"

                        docker logout "$REGISTRY"
                    '''
                }
            }
        }


        stage('Security Gate') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'harbor-registry',
                        usernameVariable: 'HARBOR_USER',
                        passwordVariable: 'HARBOR_PASSWORD'
                    )
                ]) {

                    script {

                        env.HARBOR_ARTIFACT_URL =
                            harborArtifactUrl()

                        env.HARBOR_VULNERABILITY_URL =
                            "${env.HARBOR_ARTIFACT_URL}/additions/vulnerabilities"

                        waitForHarborScan()

                        getVulnerabilityReport()

                        def counts =
                            getVulnerabilityCounts()

                        printSecurityReport(counts)

                        enforceSecurityPolicy(counts)
                    }
                }
            }
        }


        stage('Deploy') {

            steps {

                sshagent(credentials: ['deploy-ssh']) {

                    sh '''
                        ssh -p "$DEPLOY_PORT" \
                            -o StrictHostKeyChecking=no \
                            "$DEPLOY_USER@$DEPLOY_HOST" \
                            "/opt/hello-cicd/deploy.sh $BUILD_NUMBER"
                    '''
                }
            }
        }
    }


    post {

        always {

            sh '''
                rm -f \
                    harbor-artifact.json \
                    harbor-vulnerability-report.json
            '''
        }
    }
}