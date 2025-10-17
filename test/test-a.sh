# Create remotes

echo "Create dir for remotes.."
cd /home/dev
mkdir remotes
cd remotes
pwd

# Remote: project-a

echo " - Create remote for project-a"
mkdir project-a
cd project-a 
pwd
git init --bare
git symbolic-ref HEAD refs/heads/master
cd ..

# Remote: project-b

echo " - Create remote for project-b"
mkdir project-b
cd project-b
pwd
git init --bare
git symbolic-ref HEAD refs/heads/master
cd ..

# Remote: project-c

echo " - Create remote for project-c"
mkdir project-c
cd project-c
pwd
git init --bare
git symbolic-ref HEAD refs/heads/master
cd ..

# Remote: project-d

echo " - Create remote for project-d"
mkdir project-d
cd project-d
pwd
git init --bare
git symbolic-ref HEAD refs/heads/master
cd ..

# Go back to /home/dev

echo "Back to dev"
cd ..
pwd

# Clone: project-a

echo "Clone project-a"
git clone /home/dev/remotes/project-a project-a
cd project-a

echo " - Add files"

echo "This is a project" > README.md && \
  git add README.md && \
  git commit -m "Initial commit" && \
  git push origin master

cd ..

# Clone: project-b

echo "Clone project-b"
git clone /home/dev/remotes/project-b project-b
cd project-b

echo " - Add files"

echo "This is a project" > README.md && \
  git add README.md && \
  git commit -m "Initial commit" && \
  git push origin master

cd ..

# Clone: project-c

echo "Clone project-c"
git clone /home/dev/remotes/project-c project-c
cd project-c

echo " - Add files"

echo "This is a project" > README.md && \
  git add README.md && \
  git commit -m "Initial commit" && \
  git push origin master

cd ..

# Clone: project-d

echo "Clone project-d"
git clone /home/dev/remotes/project-d project-d
cd project-d

echo " - Add files"

echo "This is a project" > README.md && \
  git add README.md && \
  git commit -m "Initial commit" && \
  git push origin master

cd ..

# Add submodule to project-a

cd project-a

echo " - Add submodules"

git submodule add /home/dev/remotes/project-b project-b
git submodule add /home/dev/remotes/project-c project-c
git submodule add /home/dev/remotes/project-d project-d

/workspace/fstm --enable-colors --acknowledge-risks-and-continue --no-threads --keep-untracked-files /home/dev/project-a