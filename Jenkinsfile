@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Docker Build') {
            steps {
                dockerBuild(
                    image: 'registry.pspworks.cloud/hello-cicd/hello-cicd',
                    tag: "${BUILD_NUMBER}"
                )
            }
        }

        stage('Docker Push') {
            steps {
                dockerPush(
                    image: 'registry.pspworks.cloud/hello-cicd/hello-cicd',
                    tag: "${BUILD_NUMBER}",
                    credentials: 'harbor-registry'
                )
            }
        }
    }
}
