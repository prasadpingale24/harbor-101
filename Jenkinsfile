@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Harbor Scan') {
            steps {
                harborScan(
                    registry: 'registry.pspworks.cloud',
                    project: 'hello-cicd',
                    repository: 'hello-cicd',
                    reference: '13',
                    credentials: 'harbor-registry'
                )
            }
        }
    }
}
