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
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and deploy frontend') {
            steps {
                sh '''
                    set -e

                    docker network inspect pk_proxy >/dev/null 2>&1 || docker network create pk_proxy

                    docker compose -f docker-compose.prod.yml up -d --build
                '''
            }
        }
	
	stage('Ensure proxy is running') {
            steps {
                sh '''
                    set -e

                    cd /srv/pk-services/proxy

                    docker compose -f docker-compose.proxy.yml up -d

                    docker exec pk_nginx nginx -t
                    docker exec pk_nginx nginx -s reload
                '''
            }
        }

        stage('Check frontend') {
            steps {
                sh '''
                    set -e

                    docker ps | grep sopk_frontend

                    if docker ps --format '{{.Names}}' | grep -q '^pk_nginx$'; then
                        docker exec pk_nginx wget -qO- http://sopk_frontend/health
                        docker exec pk_nginx nginx -s reload || true
                    fi

                    echo "Frontend deployed successfully"
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

