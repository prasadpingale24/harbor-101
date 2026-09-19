def harborArtifactUrl() {
    return "https://${env.REGISTRY}/api/v2.0/projects/${env.HARBOR_PROJECT}/repositories/${env.HARBOR_REPOSITORY}/artifacts/${env.IMAGE_TAG}"
}

def getHarborArtifact() {
    sh(
        script: '''
            curl -fsSk \
                --user "$HARBOR_USER:$HARBOR_PASSWORD" \
                -H "X-Accept-Vulnerabilities: application/vnd.security.vulnerability.report; version=1.1" \
                -o harbor-artifact.json \
                "${HARBOR_ARTIFACT_URL}?with_scan_overview=true"
        ''',
        environment: [
            "HARBOR_ARTIFACT_URL=${harborArtifactUrl()}"
        ]
    )

    return readJSON file: 'harbor-artifact.json'
}

def waitForHarborScan() {
    echo "Waiting for Harbor vulnerability scan..."

    timeout(time: 5, unit: 'MINUTES') {
        waitUntil {
            def artifact = getHarborArtifact()

            def scanOverview =
                artifact.scan_overview ?: [:]

            def status = scanOverview.values()?.find { it }?.scan_status

            echo "Harbor scan status: ${status ?: 'NOT_SCANNED'}"

            switch (status) {
                case 'Complete':
                    echo "Harbor vulnerability scan completed."
                    return true

                case 'Scanning':
                case 'Queued':
                case 'Pending':
                    sleep 10
                    return false

                case 'Error':
                case 'Failed':
                    error("Harbor vulnerability scan failed.")

                default:
                    sleep 10
                    return false
            }
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

    return readJSON file: 'harbor-vulnerability-report.json'
}

def getVulnerabilityCounts(report) {
    def vulnerabilityData = report.values().find { it?.vulnerabilities != null }

    def vulnerabilities =
        vulnerabilityData?.vulnerabilities ?: []

    def counts = [
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Unknown: 0
    ]

    vulnerabilities.each { vulnerability ->
        def severity = vulnerability.severity ?: 'Unknown'

        if (!counts.containsKey(severity)) {
            counts[severity] = 0
        }

        counts[severity]++
    }

    return counts
}

def printSecurityReport(counts) {
    echo """
========================================
        HARBOR SECURITY SCAN
========================================
Critical : ${counts.Critical}
High     : ${counts.High}
Medium   : ${counts.Medium}
Low      : ${counts.Low}
Unknown  : ${counts.Unknown}
========================================
"""
}

def enforceSecurityPolicy(counts) {
    if (counts.Critical > 0) {
        error(
            "SECURITY GATE FAILED: " +
            "${counts.Critical} Critical vulnerability/vulnerabilities found."
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

                        def artifactUrl = harborArtifactUrl()

                        env.HARBOR_ARTIFACT_URL = artifactUrl

                        env.HARBOR_VULNERABILITY_URL =
                            "${artifactUrl}/additions/vulnerabilities"

                        waitForHarborScan()

                        def report =
                            getVulnerabilityReport()

                        def counts =
                            getVulnerabilityCounts(report)

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