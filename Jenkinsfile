pipeline {
    agent {
        label 'docker-builder'
    }

    environment {
        APP_NAME = 'hello-cicd'
        REGISTRY = 'registry.pspworks.cloud'
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
}