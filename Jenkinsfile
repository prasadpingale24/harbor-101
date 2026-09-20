@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Security Policy') {
            steps {
                script {

                    def report = harborReport(
                        registry: 'registry.pspworks.cloud',
                        project: 'hello-cicd',
                        repository: 'hello-cicd',
                        reference: '13',
                        credentials: 'harbor-registry'
                    )

                    vulnerabilityPolicy(
                        report: report
                    )
                }
            }
        }
    }
}
