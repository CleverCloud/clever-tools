pipeline {
  agent { label 'cc-ci-agent' }
  environment {
    GIT_TAG_NAME = gitTagName()
    S3_KEY_ID = credentials('CELLAR_CC_TOOLS_ACCESS_KEY_ID')
    S3_SECRET_KEY = credentials('CELLAR_CC_TOOLS_SECRET_ACCESS_KEY')
    BINTRAY_API_KEY = credentials('BINTRAY_CC_TOOLS_API_KEY')
  }
  stages {
    stage('build') {
      steps {
        sh 'npm install'
        sh 'node scripts/job-build.js'
      }
    }
    stage('package') {
      steps {
        sh 'node scripts/job-package.js'
      }
    }
    stage('publish') {
      when {
        not {
          environment name: 'GIT_TAG_NAME', value: ''
        }
        beforeAgent true
      }
      parallel {
        stage('cellar') {
          steps {
            sh 'node scripts/job-publish-cellar.js'
          }
        }
        stage('bintray') {
          steps {
            sh 'node scripts/job-publish-bintray.js'
          }
        }
        stage('arch/aur') {
          steps {
            sh 'echo "arch/aur"'
          }
        }
        stage('chocolatey') {
          steps {
            sh 'echo "choco"'
          }
        }
        stage('brew') {
          steps {
            sh 'echo "brew"'
          }
        }
        stage('npm') {
          steps {
            sh 'echo "npm"'
          }
        }
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'releases/**/*', fingerprint: true
    }
  }
}

@NonCPS
String gitTagName() {
    return sh(script: 'git describe --tags --exact-match $(git rev-parse HEAD) || true', returnStdout: true)?.trim()
}
