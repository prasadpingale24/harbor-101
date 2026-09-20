@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Harbor Report') {
            steps {
                script {
                    def report = harborReport(
                        registry: 'registry.pspworks.cloud',
                        project: 'hello-cicd',
                        repository: 'hello-cicd',
                        reference: '13',
                        credentials: 'harbor-registry'
                    )

                    echo "Critical: ${report.critical()}"
                    echo "High: ${report.high()}"
                    echo "Medium: ${report.medium()}"
                    echo "Low: ${report.low()}"
                    echo "Unknown: ${report.unknown()}"
                    echo "Total: ${report.total()}"
                }
            }
        }
    }
}
