# Exit if any commands fail. 
set -e

# Echo each command as they are ran
set -v

# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    echo $TRAVIS_PULL_REQUEST
    echo $TRAVIS_BRANCH
    echo $SOURCE_BRANCH
    exit 0
fi

# Log the limits for processes. Travis has some really high limits (500k file descriptors), which is awesome.
ulimit -S -a
ulimit -H -a

# Log the public IP and local time of this server. Useful for figuring out the physical location of the server (Affects ping time of requests). 
curl --insecure https://api.ipify.org/
echo
date
echo
git --version
echo

# Use this command to get the stuff in prod into the public folder. 
# time git clone -b gh-pages --single-branch git@github.com:ryanhugh/searchneu.git public
# rm -rf public/.git

if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
  npm -g install babel-cli
  cd scrapers
  PROD=true NODE_ENV=PROD babel-node --max_old_space_size=8192 main
  cd ..
fi


npm run build

eval "$(ssh-agent -s)"
mkdir -p ~/.ssh 2> /dev/null
echo $GIT_PRIVATE_KEY | base64 --decode > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-add ~/.ssh/id_rsa
git config --global user.email "ryanhughes624+gitbot@gmail.com"
git config --global user.name "data-updater-bot"
git remote remove origin
git remote add origin git@github.com:ryanhugh/searchneu.git

# Push to prod if this is the prod branch
if [ "$TRAVIS_BRANCH" == "prod" ]; then
  echo 'Deploying to prod'
  
  ssh ubuntu@34.225.112.42 'cd searchneu; git pull'
  ssh ubuntu@34.225.112.42 'cd searchneu; git checkout prod'

  scp public/ 34.225.112.42:~/searchneu/public -r
  scp backend_compiled/ 34.225.112.42:~/searchneu/backend_compiled -r

  ssh ubuntu@34.225.112.42 'cd searchneu; bash ec2_update.sh'

fi


# Tell Rollbar about the deploy
ACCESS_TOKEN=$ROLLBAR_TOKEN
ENVIRONMENT=production
LOCAL_USERNAME=`whoami`
REVISION=`git log -n 1 --pretty=format:"%H"`

curl https://api.rollbar.com/api/1/deploy/ \
  -F access_token=$ACCESS_TOKEN \
  -F environment=$ENVIRONMENT \
  -F revision=$REVISION \
  -F local_username=$LOCAL_USERNAME

echo "Done travis_deploy.sh"