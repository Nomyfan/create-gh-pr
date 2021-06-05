# Create GH PR

This action create a new branch to a repo, copy somethings into it and create a PR.

## Inputs

### `api_token`

GitHub API token

### `src_dir`

Source directory to copy

### `dest_dir`

Destination directory to copy

### `repo`

GitHub repo name

### `owner`

GitHub repo owner

### `commiter_email`

[Optional] Git commit email. Default is 'noreply@github.com'

### `commiter_name`

[Optional] Git commit user name. Default is 'GitHub'

### `commit_message`

[Optional] Git commit message. Default is 'Update $head_branch'

### `head_branch`

Head branch. ALERT: cannot be master or main

### `base_branch`

Base branch

## Example usage

```yml
- name: Create pull request
  uses: nomyfan/create-gh-pr@v1.0.0 # use latest version
  with:
    api_token: ${{ secrets.API_TOKEN_GITHUB }}
    src_dir: dist
    dest_dir: dist
    repo: test-create-gh-pr
    owner: nomyfan
    commiter_email: ${{ secrets.EMAIL }}
    commiter_name: ${{ secrets.USER_NAME }}
    head_branch: ${{ env.HEAD_BRANCH }}
    base_branch: main
```
