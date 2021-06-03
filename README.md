# Open GH PR

This action create a new branch to a repo, copy somethings into it and open a PR.

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

Git commit email

### `commiter_name`

Git commit user name

### `commit_message`

[Optional] Git commit message. Default is 'Update $head_branch'

### `head_branch`

Head branch. ALERT: cannot be master or main

### `base_branch`

Base branch

## Example usage

```yml

```
