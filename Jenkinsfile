pipeline {
    agent {
        docker {
            image 'node:20-alpine3.22'
            // Run as root inside the container so apk / package installs work
            // Expose host.docker.internal so we can reach services (like SonarQube) on the Jenkins host
            args '-u 0:0 -v /var/run/docker.sock:/var/run/docker.sock --add-host=host.docker.internal:host-gateway'
        }
    }
    
    environment {
        DOCKER_IMAGE_NAME = 'gcpv2002/p1bootcamp'
        DOCKER_IMAGE_TAG = "${env.BUILD_NUMBER}"
        // Avoid npm EACCES by using a writable cache directory inside the container
        NPM_CONFIG_CACHE = '/tmp/.npm'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('Program') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('Program') {
                    sh 'npm test'
                }
            }
        }
        
        stage('SonarQube Scan') {
            steps {
                dir('Program') {
                    script {
                        // Install Java + SonarQube Scanner CLI JAR (run via system Java to avoid embedded JRE issues)
                        sh '''
                            if [ ! -f /opt/sonar-scanner/lib/sonar-scanner-cli-5.0.1.3006.jar ]; then
                                echo "Installing OpenJDK and SonarQube Scanner CLI JAR..."
                                apk add --no-cache curl unzip openjdk17-jre-headless
                                mkdir -p /opt/sonar-scanner
                                curl -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip -o /tmp/sonar-scanner.zip
                                unzip /tmp/sonar-scanner.zip -d /tmp/
                                mv /tmp/sonar-scanner-5.0.1.3006-linux/lib /opt/sonar-scanner/
                                rm -rf /tmp/sonar-scanner-5.0.1.3006-linux /tmp/sonar-scanner.zip
                            fi
                            java -version
                        '''
                    }
                    script {
                        withCredentials([string(credentialsId: 'sonarUserToken', variable: 'SONAR_TOKEN')]) {
                            sh '''
                                java -jar /opt/sonar-scanner/lib/sonar-scanner-cli-5.0.1.3006.jar \
                                    -Dsonar.projectKey=bootcampP1 \
                                    -Dsonar.sources=. \
                                    -Dsonar.host.url=http://host.docker.internal:9000 \
                                    -Dsonar.token=${SONAR_TOKEN}
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    env.DOCKER_IMAGE_FULL = "${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}"
                    sh """
                        apk add --no-cache docker-cli
                        docker build -t ${env.DOCKER_IMAGE_FULL} .
                    """
                }
            }
        }
        
        stage('Trivy Image Scan') {
            steps {
                script {
                    sh """
                        if ! command -v trivy &> /dev/null; then
                            apk add --no-cache curl
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                        fi
                        trivy image --exit-code 0 --severity HIGH,CRITICAL ${env.DOCKER_IMAGE_FULL}
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'DockerhubCreds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        // Use a single-quoted shell script and plain $VAR references to avoid Groovy interpolation of secrets
                        sh '''
                            apk add --no-cache docker-cli
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                            docker push "$DOCKER_IMAGE_FULL"
                        '''
                    }
                }
            }
        }
        
        stage('Update Deployment Definition') {
            environment {
                GIT_REPO_NAME = 'P1-Bootcamp'
                GIT_USER_NAME = 'gcpv2002'
            }
            steps {
                script {
                    def imageTag = "${env.DOCKER_IMAGE_NAME}:${env.DOCKER_IMAGE_TAG}"
                    // Update local copy in the workspace (for logs/artifacts)
                    sh "sed -i 's|image:.*|image: ${imageTag}|g' Deployment.yaml"

                    // Use a GitHub personal access token stored as a Secret Text credential 'githubToken'
                    withCredentials([string(credentialsId: 'githubToken', variable: 'GITHUB_TOKEN')]) {
                        withEnv(["IMAGE_TAG=${imageTag}"]) {
                            sh '''
                                set -e
                                apk add --no-cache git

                                # Fresh clone of the repo inside the container (do not rely on workspace .git)
                                rm -rf /tmp/repo
                                git clone "https://git:$GITHUB_TOKEN@github.com/$GIT_USER_NAME/$GIT_REPO_NAME.git" /tmp/repo
                                cd /tmp/repo

                                # Update Deployment.yaml with new image tag
                                sed -i "s|image:.*|image: $IMAGE_TAG|g" Deployment.yaml

                                git config user.name "Jenkins"
                                git config user.email "jenkins@ci"

                                git add Deployment.yaml
                                git commit -m "Update deployment image to $IMAGE_TAG" || true

                                # Push back to the same branch Jenkins checked out
                                git push "https://git:$GITHUB_TOKEN@github.com/$GIT_USER_NAME/$GIT_REPO_NAME.git" "HEAD:${GIT_BRANCH#origin/}" || true
                            '''
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "Pipeline succeeded! Image: ${env.DOCKER_IMAGE_FULL}"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}


