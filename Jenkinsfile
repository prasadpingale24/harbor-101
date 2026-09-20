@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Wait for Harbor Scan') {
            steps {
                harborScanWait(
                    registry: 'registry.pspworks.cloud',
                    project: 'hello-cicd',
                    repository: 'hello-cicd',
                    reference: '13',
                    credentials: 'harbor-registry',
                    timeoutMinutes: 5
                )
            }
        }
    }
}
