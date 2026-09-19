pipeline {
    agent {
        label 'docker-builder'
    }

    environment {
        APP_NAME = 'hello-cicd'
        REGISTRY = 'registry.pspworks.cloud'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
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
                script {
                    sh "docker build -t ${REGISTRY}/${APP_NAME}/${APP_NAME}:${IMAGE_TAG} ."
                }
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

                        docker push "$REGISTRY/$APP_NAME/$APP_NAME:$IMAGE_TAG"

                        docker logout "$REGISTRY"
                    '''
                }
            }
        }
    }
}