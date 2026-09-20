@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Security Scan') {
            steps {
                script {

                    def registry = 'registry.pspworks.cloud'
                    def project = 'hello-cicd'
                    def repository = 'hello-cicd'
                    def reference = '13'
                    def credentials = 'harbor-registry'

                    harborScan(
                        registry: registry,
                        project: project,
                        repository: repository,
                        reference: reference,
                        credentials: credentials
                    )

                    harborScanWait(
                        registry: registry,
                        project: project,
                        repository: repository,
                        reference: reference,
                        credentials: credentials,
                        timeoutMinutes: 5
                    )

                    def report = harborReport(
                        registry: registry,
                        project: project,
                        repository: repository,
                        reference: reference,
                        credentials: credentials
                    )

                    vulnerabilityPolicy(
                        report: report
                    )
                }
            }
        }
    }
}
