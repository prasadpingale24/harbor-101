@Library('cicd-library') _

pipeline {

    agent {
        label 'docker-builder'
    }

    environment {
        IMAGE = 'registry.pspworks.cloud/hello-cicd/hello-cicd'

        DEPLOY_HOST = '72.60.78.85'
        DEPLOY_PORT = '22022'
        DEPLOY_USER = 'deploy'
    }

    stages {

        stage('Docker Build') {
            steps {
                dockerBuild(
                    image: "${IMAGE}",
                    tag: "${BUILD_NUMBER}"
                )
            }
        }

        stage('Docker Push') {
            steps {
                dockerPush(
                    image: "${IMAGE}",
                    tag: "${BUILD_NUMBER}",
                    credentials: 'harbor-registry'
                )
            }
        }

        stage('Deploy') {
            steps {
                sshDeploy(
                    host: "${DEPLOY_HOST}",
                    user: "${DEPLOY_USER}",
                    port: "${DEPLOY_PORT}",
                    credentials: 'deploy-ssh',
                    command: "/opt/hello-cicd/deploy.sh ${BUILD_NUMBER}"
                )
            }
        }
    }
}
