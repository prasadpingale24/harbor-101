@Library('cicd-library@main') _

pipeline {

    agent {
        label 'docker-builder'
    }

    stages {

        stage('Shared Library Test') {
            steps {
                hello()
            }
        }
    }
}
