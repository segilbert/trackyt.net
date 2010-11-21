﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Trackyourtasks.Core.DAL.Repositories.Impl;
using Trackyourtasks.Core.DAL.DataModel;
using Trackyourtasks.Core.DAL.Extensions;
using Trackyourtasks.Core.DAL.Repositories;
using AutoMapper;
using Web.API.v1.Model;
using Web.Infrastructure.Security;

namespace Web.API.v1.Controllers
{
    //Used AutoMapper, good example found here:
    //http://richarddingwall.name/2009/08/18/asp-net-mvc-tdd-and-automapper/

    // Used JSON and APS.net MVC
    // http://haacked.com/archive/2010/04/15/sending-json-to-an-asp-net-mvc-action-method-argument.aspx

    // Information used, how to unit test JSON response
    // http://www.heartysoft.com/post/2010/05/25/ASPNET-MVC-Unit-Testing-JsonResult-Returning-Anonymous-Types.aspx

    //TODO: error handling
    //TODO: HandleError have to be added here (perfaps, this not only class to have it)
    // Information
    // http://forums.asp.net/p/1471123/3407713.aspx
    // http://weblogs.asp.net/scottgu/archive/2008/07/14/asp-net-mvc-preview-4-release-part-1.aspx

    public class ApiV1Controller : Controller
    {
        private ITasksRepository _repository;
        private IMappingEngine _mapper;

        public ApiV1Controller(ITasksRepository repository, IMappingEngine mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        [HttpPost]
        public JsonResult Authenticate(string email, string password)
        {
            return Json(null);
        }

        [HttpPost]
        [TrackyAuthorizeAttribute(LoginController = "Login")]
        public JsonResult GetAllTasks(int id)
        {
            var tasksQuery = _repository.Tasks.WithUserId(id);
            return Json(tasksQuery.Select(t => _mapper.Map<Task, TaskDto>(t)).ToList());
        }

        [HttpPost]
        [TrackyAuthorizeAttribute(LoginController = "Login")]
        public JsonResult Submit(int id, IList<TaskDto> tasks)
        {
            foreach (var taskData in tasks)
            {
                var task = taskData.Id == 0 ? new Task() : _repository.Tasks.WithId(taskData.Id);
                task.UserId = id;
                task.Number = taskData.Number;
                task.Description = taskData.Description;
                task.ActualWork = taskData.ActualWork;

                _repository.SaveTask(task);
            }

            return Json(null);
        }

        [HttpPost]
        [TrackyAuthorizeAttribute(LoginController = "Login")]
        public JsonResult Delete(int id, IList<TaskDto> tasks)
        {
            foreach (var taskData in tasks)
            {
                if (taskData.Id != 0)
                {
                    var taskToDelete = _repository.Tasks.WithId(taskData.Id);
                    _repository.DeleteTask(taskToDelete);
                }
            }

            return Json(null);
        }

    }
}