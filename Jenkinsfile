def harborArtifactUrl() {
    return "https://${env.REGISTRY}/api/v2.0/projects/${env.HARBOR_PROJECT}/repositories/${env.HARBOR_REPOSITORY}/artifacts/${env.IMAGE_TAG}"
}

def harborVulnerabilityUrl() {
    return "${harborArtifactUrl()}/additions/vulnerabilities"
}

def harborHeaders() {
    return "--user \"${env.HARBOR_USER}:${env.HARBOR_PASSWORD}\""
}

def waitForHarborScan() {
    echo "Waiting for Harbor vulnerability scan..."

    timeout(time: 5, unit: 'MINUTES') {
        waitUntil {
            def status = sh(
                script: """
                    curl -sk ${harborHeaders()} \
                        -o harbor-vulnerability-report.json \
                        -w "%{http_code}" \
                        "${harborVulnerabilityUrl()}"
                """,
                returnStdout: true
            ).trim()

            if (status == '200') {
                echo "Harbor vulnerability scan completed."
                return true
            }

            echo "Harbor scan not ready yet (HTTP ${status}). Retrying..."
            sleep 10

            return false
        }
    }
}

def getVulnerabilityCounts() {
    return sh(
        script: '''
            python3 <<'PY'
import json

with open("harbor-vulnerability-report.json") as f:
    data = json.load(f)

report = next(iter(data.values()))
vulnerabilities = report.get("vulnerabilities", [])

counts = {
    "Critical": 0,
    "High": 0,
    "Medium": 0,
    "Low": 0,
    "Unknown": 0
}

for vulnerability in vulnerabilities:
    severity = vulnerability.get("severity", "Unknown")
    counts[severity] = counts.get(severity, 0) + 1

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
                        waitForHarborScan()

                        def counts = getVulnerabilityCounts()

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
            sh 'rm -f harbor-vulnerability-report.json || true'
        }
    }
}