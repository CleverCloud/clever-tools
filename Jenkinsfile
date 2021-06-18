pipeline {
  agent { label 'cc-ci-agent' }
  environment {
    GIT_TAG_NAME = gitTagName()
    S3_KEY_ID = credentials('CELLAR_CC_TOOLS_ACCESS_KEY_ID')
    S3_SECRET_KEY = credentials('CELLAR_CC_TOOLS_SECRET_ACCESS_KEY')
    BINTRAY_API_KEY = credentials('BINTRAY_CC_TOOLS_API_KEY')
    NPM_TOKEN = credentials('NPM_TOKEN')
  }
  options {
    buildDiscarder(logRotator(daysToKeepStr: '5', numToKeepStr: '10', artifactDaysToKeepStr: '5', artifactNumToKeepStr: '10'))
  }
  stages {
    stage('test') {
      agent {
        docker {
          image 'centos:7'
          // Run the container on the node specified at the top-level of the Pipeline, in the same workspace, rather than on a new node entirely:
          reuseNode true
        }
      }
      steps {
          sh 'echo "hello foobar"'
          sh 'ls /'
          sh 'uname -a'
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'releases/**/*', fingerprint: true, onlyIfSuccessful: true
    }
  }
}

@NonCPS
String gitTagName() {
    return sh(script: 'git describe --tags --exact-match $(git rev-parse HEAD) || true', returnStdout: true)?.trim()
}
