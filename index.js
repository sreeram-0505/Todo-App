

//Event Listeners

//Delete completed tasks button handler
document.getElementById('remove_completed').addEventListener('click', handleDeleteCompleted)

//Filter change handler
document.getElementById('filter').addEventListener('change', onFilterChange);

//Search handler
document.getElementById('search-tasks').addEventListener('input', (event) => { handleSearch(event) });

let state = {
    todoList: [],
    filterType: "ALL",
    listToRender: [],
    searchKey: ''
}

window.onload = function () {
    get('', {}).then((response) => {
        state.todoList = JSON.parse(response);
        render();
    }
    ).catch((responseError) => {
        console.log(responseError)
        renderError()
    })
    formRender();
    renderProgress();
    render();
};

let formState = {
    task_name: '',
    task_status: '',
    task_tags: '',
    type: 'NEW'
}



function formRender() {
    let html = `<div class="row container-fluid">
            <form class='container'>
                <div class="form-group">
                  <label for="taskName">Task Name</label>
                    <input type="text" class="form-control" id="task_name"  placeholder="Enter Task Name"  value= '${formState.task_name ? formState.task_name : ''}' >
                  <small style = "display : none" id="valid-feedback" class="form-text text-danger">Task name should not be empty and allowed task length is 100 characters</small>
                </div>
                <div class="form-group">
                    <label for="task_status">Status</label>
                    <select class="form-control" id="task_status"  >
                      <option value="PENDING" ${(formState.task_status == 'PENDING') ? 'selected' : ''}>Pending</option>
                      <option value="COMPLETED" ${(formState.task_status == 'COMPLETED') ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <input type="text" data-role="tagsinput" id='task_tags'  placeholder="Add tags" value=${formState.task_tags ? formState.task_tags : ''} >
                </div>
                <button type="button" class="btn btn-primary" id ='add-todo'>Save</button>
              </form>
        </div>`
    document.getElementById('form').innerHTML = html;
    $("input[data-role=tagsinput]").tagsinput('refresh');
    document.getElementById('add-todo').addEventListener('click', onAddingTodo);
}

function handleDeleteCompleted() {

    let ids = []
    state.todoList.forEach((item) => {
        if (item.isCompleted == true)
            ids.push(item.id);
    })

    Promise.all(ids.map((id) => Delete(id))).then((response) => {
        state.todoList = state.todoList.filter((todo) => todo.isCompleted === false);
        render();
        $('#deleteModal').modal('hide');
    }).catch((response) => console.log(response))
}

function onAddingTodo(event) {
    event.preventDefault();
    let task_name = document.getElementById("task_name").value;
    let task_status = document.getElementById("task_status").value;
    let task_tags = document.getElementById("task_tags").value;
    if (task_name === "" || task_name.length > 100 ) {
        document.getElementById("valid-feedback").style.display = 'block';
        return;
    }
    const todo = {
        task_name,
        task_status,
        task_tags,
        id: getID(),
        isCompleted: task_status == 'COMPLETED'
    }
    if (formState.type === 'EDIT') {
        const formId = formState.id;
        put(todo).then((response) => {
            for (let i = 0; i < state.todoList.length; i++) {
                if (state.todoList[i].id === formId)
                    state.todoList[i] = todo;
            }
            render();
        }).catch((response) => console.log(response))
    }
    else {
        post('', todo).then((response) => {
            state.todoList.push(todo);
            render();
        }).catch((response) => alert("Failed to load to server"))
    }

    formState = {
        task_name: '',
        task_status: '',
        task_tags: '',
        type: 'NEW'
    }
    render();
    formRender();
    document.getElementById("valid-feedback").style.display = 'none';

}

function getID() {
    if (formState.type == 'EDIT')
        return formState.id;
    return new Date().getTime().toString();
}


function onFilterChange(event) {
    const filterType = event.target.value;
    state.filterType = filterType;
    render();
}

function handleSearch(event) {
    state.searchKey = event.target.value;
    render();
}



const handleDelete = (id) => {
    Delete(id).then((respponse) => {
        state.todoList = state.todoList.filter((todo) => todo.id != id);
        render();
    }).catch((response) => console.log(response))
}

const handleEdit = (id) => {
    formState = state.todoList.filter((todo) => todo.id == id)[0];
    formState.type = 'EDIT';
    formState.id = id;
    formRender();
}



const toggleTodo = (id) => {
    let modified = state.todoList.filter((todo) => (todo.id == id))[0];
    modified.isCompleted = !modified.isCompleted;
    modified.task_status = (modified.isCompleted) ? 'COMPLETED' : 'PENDING';
    put(modified).then(() => {
        render();
    }).catch((response) => console.log(response))
}

function getSearchResults() {
    let key = state.searchKey.toLowerCase();
    return state.listToRender.filter((item) => {
        if (item && (item.task_status.toLowerCase().includes(key) || item.task_tags.toLowerCase().includes(key) || item.task_name.toLowerCase().includes(key)))
            return true;
        return false;
    })
}

function render() {
    renderProgress();
    if (state.filterType === "ALL")
        state.listToRender = state.todoList;
    else if (state.filterType === "PENDING")
        state.listToRender = state.todoList.filter((todo) => todo.isCompleted === false);
    else if (state.filterType === 'COMPLETED')
        state.listToRender = state.todoList.filter((todo) => todo.isCompleted === true);
    state.listToRender = getSearchResults();

    let header = (state.searchKey !== '') ? 'SEARCHED' : state.filterType;
    document.getElementById('list-type-header').innerText = header + ' Tasks';
    document.getElementById('todoList').innerHTML = '';
    if (state.listToRender.length === 0) {
        document.getElementById("empty-list").style.display = 'block';
        return;
    }
    else
        document.getElementById("empty-list").style.display = 'none';
    let strTable = '';
    state.listToRender.forEach(
        (todo) => {
            strTable += `
        <tr>
        <td >
        <div class="custom-control custom-checkbox">
            <input type="checkbox" class="custom-control-input toggle-status" ${(todo.isCompleted) ? 'checked' : ''} id=${todo.id} onchange = "toggleTodo(${todo.id})" >
            <label class="custom-control-label" for=${todo.id}></label>
        </div>
        </td>
        <td>${todo.task_name}</td>
        <td>${todo.task_tags}</td>
        <td>${todo.task_status}</td>
        <td>
            <button type="button" id='${todo.id}'  class="btn edit_todo btn-link" onclick='handleEdit(${todo.id})'>Edit</button>
            <button type="button" id='${todo.id}'  class=" remove_todo btn btn-link text-danger" onclick='handleDelete(${todo.id})'>Delete</button>
        </td>
      </tr>`
        }
    );
    let str = `<table class="table table-striped">
<thead>
  <tr>
    <th scope="col">Toggle</th>
    <th scope="col">Name</th>
    <th scope="col">Tags</th>
    <th scope="col">Status</th>
    <th scope="col">Actions</th>
  </tr>
</thead>
<tbody>
  ${strTable}
</tbody>
</table>`;
    document.getElementById('todoList').innerHTML = str;
}

function getProgress() {
    let total = state.todoList.length;
    let completed = state.todoList.filter(item => item.isCompleted == true).length;
    let pending = total - completed;
    return {
        total, pending, completed
    };
}
//Progress
function renderProgress() {
    let status = getProgress();
    let completedPerc;
    if (status.total == 0) {
        completedPerc = 100;
    }
    else {
        completedPerc = Math.floor((status.completed / status.total) * 100);
    }

    let pendingPerc = 100 - completedPerc;
    let str = `
    <h5>Progress</h5>
    <div class="progress h-50">
    <div class="progress-bar " style="width:${completedPerc}%">${completedPerc}%(${status.completed}) Completed</div>
    <div class="progress-bar  bg-danger" style="width:${pendingPerc}%">${pendingPerc}%(${status.pending}) Pending</div>
<div>`
    document.getElementById('progress').innerHTML = str;
}




function renderError() {
    let str = `<div class="card">
    <div class="card-body">
        <div class="alert alert-danger" role="alert">
            <strong>Oh snap!</strong> There is a Network Error.Please Try again Later.
        </div>
    </div>
</div>`;
document.body.innerHTML = str;
}



/* Api calls*/

let baseUrl = "http://localhost:3000/tasks/"

function get(url, data) {
    url = baseUrl + ((url) ? url : '');
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.send();
        xhr.onload = () => {
            if (xhr.status === 200)
                resolve(xhr.response)
            else
                reject(xhr.response)
        }
        xhr.onerror = () => reject(xhr.statusText);
    });
}



function post(url, data) {
    url = baseUrl;
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(data));
        xhr.onload = () => {
            if (xhr.status === 201)
                resolve(xhr.response)
            else
                reject(xhr.response)
        }
        xhr.onerror = () => reject(xhr.statusText);
    });
}


function Delete(data) {
    let url = baseUrl;
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        url += data;
        xhr.open("DELETE", url);
        xhr.send();
        xhr.onload = () => {
            if (xhr.status === 200)
                resolve(xhr.response)
            else
                reject(xhr.response)
        }
        xhr.onerror = () => reject(xhr.statusText);
    });
}

function put(data) {
    let url = baseUrl;
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        url += data.id;
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(data));
        xhr.onload = () => {
            if (xhr.status === 200)
                resolve(xhr.response)
            else
                reject(xhr.response)
        }
        xhr.onerror = () => reject(xhr.statusText);
    });
}






/* Api calls*/

