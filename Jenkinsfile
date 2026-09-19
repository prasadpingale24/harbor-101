pipeline {
    agent {
        label 'docker-builder'
    }

    environment {
        APP_NAME = 'hello-cicd'
        IMAGE_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
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
                    echo "Building Docker image: ${APP_NAME}:${IMAGE_TAG}"
                    sh "docker build -t ${APP_NAME}:${IMAGE_TAG} ."
                }
            }
        }

        // Docker Login
        // Push to Harbor
        // Deploy
    }
}