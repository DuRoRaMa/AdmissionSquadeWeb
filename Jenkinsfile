pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Sync frontend master') {
            steps {
                sh '''
                    git config --global --add safe.directory /srv/pk-services/Squad/AdmissionSquadeWeb

                    cd /srv/pk-services/Squad/AdmissionSquadeWeb
                    git fetch origin master
                    git reset --hard origin/master
                '''
            }
        }

        stage('Build and deploy frontend') {
            steps {
                sh '''
                    cd /srv/pk-services/Squad/AdmissionSquadeWeb

                    docker network inspect pk_proxy >/dev/null 2>&1 || docker network create pk_proxy

                    docker compose -f docker-compose.prod.yml up -d --build
                '''
            }
        }

        stage('Frontend checks') {
            steps {
                sh '''
                    docker ps | grep sopk_frontend
                    docker exec pk_nginx wget -qO- http://sopk_frontend/health
                    docker exec pk_nginx nginx -s reload
                '''
            }
        }
    }

    post {
        success {
            echo 'Frontend production deploy completed successfully.'
        }
        failure {
            echo 'Frontend production deploy failed.'
        }
    }
}

